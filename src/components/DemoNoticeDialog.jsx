import React, { useState } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

const NOTICE_DISMISS_KEY = "flavorFusionDemoNoticeDismissed";

const demoAccounts = [
  { role: "Admin", email: "mucollariantonio@gmail.com" },
  { role: "Manager (KFC)", email: "kehej55584@soppat.com" },
  { role: "Branch manager for KFC", email: "ardit.hoxha@kfc.al" },
  { role: "Delivery", email: "argjendkaika@gmail.com" },
  { role: "Customer", email: "customer0@emaildomain.com" },
];

export default function DemoNoticeDialog() {
  const [isOpen, setIsOpen] = useState(() => {
    return localStorage.getItem(NOTICE_DISMISS_KEY) !== "true";
  });

  const handleOk = () => {
    localStorage.setItem(NOTICE_DISMISS_KEY, "true");
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto rounded-lg sm:max-w-2xl">
        <AlertDialogHeader>
          <div className="mb-1 inline-flex w-fit rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Welcome to Flavor Fusion Demo!
          </div>
          <AlertDialogTitle className="text-xl font-bold tracking-tight">
            Seamless Guest Experience Enabled
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-relaxed text-muted-foreground mt-2">
            To make exploring this platform effortless, **you have been automatically logged in as a Customer**! Feel free to browse menus, add items to your cart, and place mock orders immediately.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 text-sm mt-2">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm text-foreground">
            <p className="font-semibold text-primary">Testing other roles?</p>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">
              If you want to explore the backend or dispatch dashboards for other roles (such as **Admin**, **Restaurant Owner**, **Branch Manager**, or **Delivery Rider**), simply log out from the navigation. 
            </p>
            <p className="mt-1.5 leading-relaxed text-muted-foreground">
              On the Sign In page, you will find our **Demo Quick Login** dashboard, which lets you instantly switch to any account with a single click—no copy-pasting required!
            </p>
          </div>

          <div className="rounded-md border bg-muted/30 p-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Available Demo Accounts</p>
            <div className="space-y-1.5">
              {demoAccounts.map((account) => (
                <div
                  key={account.email}
                  className="flex justify-between items-center text-xs py-1 border-b border-muted last:border-0"
                >
                  <span className="font-medium text-foreground">{account.role}</span>
                  <span className="font-mono text-muted-foreground">{account.email}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <AlertDialogFooter className="mt-4">
          <Button type="button" onClick={handleOk} className="w-full">
            Awesome, let's explore!
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
