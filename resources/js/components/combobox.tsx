import { Check, ChevronsUpDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

export interface ComboboxOption {
    value: string;
    label: string;
}

interface ComboboxProps {
    options: ComboboxOption[];
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    emptyText?: string;
    allLabel?: string;
    className?: string;
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = 'Select...',
    searchPlaceholder = 'Search...',
    emptyText = 'No results found.',
    allLabel = 'All',
    className,
}: ComboboxProps) {
    const [open, setOpen] = useState(false);
    const selected = options.find(o => o.value === value);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn('justify-between font-normal', !selected && 'text-muted-foreground', className)}
                >
                    <span>{selected ? selected.label : placeholder}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-(--radix-popover-trigger-width) p-0">
                <Command filter={(value, search) => value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0}>
                    <CommandInput placeholder={searchPlaceholder} className="h-9" />
                    <CommandList>
                        <CommandEmpty>{emptyText}</CommandEmpty>
                        <CommandGroup>
                            <CommandItem
                                value=""
                                onSelect={() => { onChange(''); setOpen(false); }}
                            >
                                {allLabel}
                                <Check className={cn('ml-auto h-4 w-4', value === '' ? 'opacity-100' : 'opacity-0')} />
                            </CommandItem>
                            {options.map(opt => (
                                <CommandItem
                                    key={opt.value}
                                    value={opt.label}
                                    onSelect={() => { onChange(opt.value === value ? '' : opt.value); setOpen(false); }}
                                >
                                    {opt.label}
                                    <Check className={cn('ml-auto h-4 w-4', value === opt.value ? 'opacity-100' : 'opacity-0')} />
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
