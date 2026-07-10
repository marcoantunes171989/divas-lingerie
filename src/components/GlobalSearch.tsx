import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { normalizeSearch } from "@/lib/format";
import { menuItems } from "@/components/AppSidebar";

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleSelect = (url: string) => {
    setOpen(false);
    navigate({ to: url });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden sm:flex h-9 w-56 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground shadow-sm hover:bg-accent transition-colors"
      >
        <Search className="h-4 w-4 shrink-0" />
        <span className="flex-1 text-left truncate">Buscar telas...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          Ctrl K
        </kbd>
      </button>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex sm:hidden h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
        aria-label="Buscar telas"
      >
        <Search className="h-4 w-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="overflow-hidden p-0 max-w-lg">
          <DialogTitle className="sr-only">Buscar telas</DialogTitle>
          <Command
            filter={(value, search) =>
              normalizeSearch(value).includes(normalizeSearch(search)) ? 1 : 0
            }
          >
            <CommandInput placeholder="Buscar telas..." />
            <CommandList>
              <CommandEmpty>Nenhuma tela encontrada.</CommandEmpty>
              <CommandGroup heading="Telas">
                {menuItems.map((item) => (
                  <CommandItem
                    key={item.url}
                    value={item.title}
                    onSelect={() => handleSelect(item.url)}
                    className="cursor-pointer gap-2"
                  >
                    <item.icon className="h-4 w-4" />
                    {item.title}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </DialogContent>
      </Dialog>
    </>
  );
}
