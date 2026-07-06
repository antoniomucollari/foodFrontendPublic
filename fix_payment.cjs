const fs = require('fs');
const path = require('path');

const PAYMENT_STATUSES_OLD = [
  "PENDING",
  "AWAITING",
  "COMPLETED",
  "REJECTED",
  "FAILED",
  "REFUNDED",
  "CANCELED",
  "TO_REFUND",
];

const NEW_PAYMENT_STATUSES_CODE = `const PAYMENT_STATUSES = [
  "PENDING",
  "REJECTED",
  "COMPLETED",
  "FAILED",
  "REFUNDED",
  "PENDING_PAYMENT",
  "CANCELED",
  "TO_REFUND",
  "EXPIRED",
  "ABANDONED",
];`;

const OLD_PAYMENT_STATUSES_REGEX = /const\s+PAYMENT_STATUSES\s*=\s*\[[\s\S]*?\];/;

const walkSync = function(dir, filelist) {
  const files = fs.readdirSync(dir);
  filelist = filelist || [];
  files.forEach(function(file) {
    if (fs.statSync(path.join(dir, file)).isDirectory()) {
      filelist = walkSync(path.join(dir, file), filelist);
    }
    else if (file.endsWith('.jsx') || file.endsWith('.js')) {
      filelist.push(path.join(dir, file));
    }
  });
  return filelist;
};

const regexGetColorOld = /case "AWAITING":\s+return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";/;
const regexGetColorNew = `case "PENDING_PAYMENT":\n        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";\n      case "EXPIRED":\n        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";\n      case "ABANDONED":\n        return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";`;

const regexOptionOld = /<option value="AWAITING">Awaiting<\/option>/g;

const files = walkSync('src');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // 1. Array declaration
  if (content.match(OLD_PAYMENT_STATUSES_REGEX)) {
    content = content.replace(OLD_PAYMENT_STATUSES_REGEX, NEW_PAYMENT_STATUSES_CODE);
  } else if (content.includes('const PAYMENT_STATUSES = [')) {
    // maybe formatted differently
    let lines = content.split('\n');
    let start = -1;
    let end = -1;
    for(let i=0; i<lines.length; i++){
      if(lines[i].includes('const PAYMENT_STATUSES = [')) start = i;
      if(start !== -1 && lines[i].includes('];')) { end = i; break; }
    }
    if (start !== -1 && end !== -1) {
       lines.splice(start, end-start+1, NEW_PAYMENT_STATUSES_CODE);
       content = lines.join('\n');
    }
  }

  // 1.b array inline in OrderDetailModal?
  content = content.replace(/ \[\n\s+"PENDING",\n\s+"AWAITING",\n\s+"COMPLETED",\n\s+"REJECTED",\n\s+"FAILED",\n\s+"REFUNDED",\n\s+"CANCELED",\n\s+"TO_REFUND",\n\s+\]/g, 
  ` [
      "PENDING",
      "REJECTED",
      "COMPLETED",
      "FAILED",
      "REFUNDED",
      "PENDING_PAYMENT",
      "CANCELED",
      "TO_REFUND",
      "EXPIRED",
      "ABANDONED",
    ]`);
	
  content = content.replace(/(paymentStatus\s*===\s*["'])AWAITING(["'])/g, '$1PENDING_PAYMENT$2');

  // 2. Map getPaymentStatusColor
  content = content.replace(regexGetColorOld, regexGetColorNew);

  // 3. Option value
  content = content.replace(regexOptionOld, '<option value="PENDING_PAYMENT">Pending Payment</option>\n                      <option value="EXPIRED">Expired</option>\n                      <option value="ABANDONED">Abandoned</option>');

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated: ' + file);
  }
});
