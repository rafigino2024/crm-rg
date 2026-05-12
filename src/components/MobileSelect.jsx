import { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";

export default function MobileSelect({
  value,
  onValueChange,
  placeholder,
  label,
  children,
}) {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>{children}</SelectContent>
      </Select>
    );
  }

  // Normalize children of SelectContent to always be an array
  const rawItems = children.props?.children;
  const items = rawItems ? (Array.isArray(rawItems) ? rawItems : [rawItems]) : [];

  // Extract the selected item text for display
  const selectedText = items.find(
    (child) => child?.props?.value === value
  )?.props?.children || placeholder;

  return (
    <>
      <button
        onClick={() => setDrawerOpen(true)}
        className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm hover:bg-accent transition-colors"
      >
        <span className={value ? "text-foreground" : "text-muted-foreground"}>{selectedText}</span>
        <svg
          className="w-4 h-4 opacity-50"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{label}</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-2 p-4 pb-6">
            {items.filter(Boolean).map((item) => (
              <Button
                key={item.props?.value}
                variant={value === item.props?.value ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => {
                  onValueChange(item.props?.value);
                  setDrawerOpen(false);
                }}
              >
                {item.props?.children}
              </Button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}