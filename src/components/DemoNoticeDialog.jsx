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

const NOTICE_STORAGE_KEY = "flavorFusionDemoNoticeOkCount";
const REQUIRED_CONFIRMATIONS = 2;

const demoAccounts = [
  { role: "Admin", email: "mucollariantonio@gmail.com" },
  { role: "Manager (KFC)", email: "kehej55584@soppat.com" },
  { role: "Branch manager for KFC", email: "ardit.hoxha@kfc.al" },
  { role: "Delivery", email: "argjendkaika@gmail.com" },
  { role: "Customer", email: "customer0@emaildomain.com" },
];

function getSavedConfirmationCount() {
  const savedCount = Number(localStorage.getItem(NOTICE_STORAGE_KEY));

  return Number.isFinite(savedCount) ? savedCount : 0;
}

export default function DemoNoticeDialog() {
  const [confirmationCount, setConfirmationCount] = useState(() =>
    getSavedConfirmationCount(),
  );
  const [isOpen, setIsOpen] = useState(() => getSavedConfirmationCount() === 0);

  const nextStep = Math.min(confirmationCount + 1, REQUIRED_CONFIRMATIONS);

  React.useEffect(() => {
    if (confirmationCount !== 1 || isOpen) return undefined;

    const handleNextInteraction = () => {
      setIsOpen(true);
    };

    document.addEventListener("click", handleNextInteraction, {
      once: true,
    });

    return () => {
      document.removeEventListener("click", handleNextInteraction);
    };
  }, [confirmationCount, isOpen]);

  const handleOk = () => {
    const updatedCount = Math.min(
      confirmationCount + 1,
      REQUIRED_CONFIRMATIONS,
    );

    localStorage.setItem(NOTICE_STORAGE_KEY, String(updatedCount));
    setConfirmationCount(updatedCount);
    setIsOpen(false);
  };

  return (
    <AlertDialog open={isOpen}>
      <AlertDialogContent className="max-h-[90vh] overflow-y-auto rounded-lg sm:max-w-2xl">
        <AlertDialogHeader>
          <div className="mb-1 inline-flex w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            Demo notice {nextStep} of {REQUIRED_CONFIRMATIONS}
          </div>
          <AlertDialogTitle className="text-xl">
            Testing and demo login information
          </AlertDialogTitle>
          <AlertDialogDescription className="text-sm leading-6">
            This project is a backend and DevOps-focused hobby project that I
            have worked on for 1 year. Please do not expect every frontend
            criterion to be perfect. The experience is best viewed from a PC;
            the responsive layout might not be perfect, but it is good.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 text-sm">
          <div className="rounded-md border bg-muted/40 p-4">
            <p className="font-medium text-foreground">Shared password</p>
            <p className="mt-1 break-all font-mono text-base text-foreground">
              Toni145@!
            </p>
          </div>

          <div className="space-y-2">
            {demoAccounts.map((account) => (
              <div
                key={account.email}
                className="grid gap-1 rounded-md border p-3 sm:grid-cols-[180px_1fr] sm:items-center"
              >
                <span className="font-medium text-foreground">
                  {account.role}
                </span>
                <span className="break-all font-mono text-xs text-muted-foreground sm:text-sm">
                  {account.email}
                </span>
              </div>
            ))}
          </div>

          <p className="rounded-md bg-primary/5 p-3 text-muted-foreground">
            These accounts are only for testing and demo purposes. Please log in
            as the customer at least once for the best experience.
          </p>
        </div>

        <AlertDialogFooter>
          <Button type="button" onClick={handleOk} className="w-full sm:w-auto">
            OK
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
