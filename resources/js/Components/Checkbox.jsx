import { Checkbox as UiCheckbox } from '@/Components/ui/checkbox';
import { Label } from '@/Components/ui/label';
import { cn } from '@/lib/utils';

export default function Checkbox({ className = '', label, checked, onChange, id, ...props }) {
    const controlId = id ?? (label ? `checkbox-${String(label).toLowerCase().replace(/\s+/g, '-')}` : undefined);

    const control = (
        <UiCheckbox
            id={controlId}
            className={cn(className)}
            checked={!!checked}
            onCheckedChange={(value) => {
                onChange?.({ target: { checked: value === true } });
            }}
            {...props}
        />
    );

    if (!label) {
        return control;
    }

    return (
        <div className="flex items-center gap-2">
            {control}
            <Label htmlFor={controlId} className="cursor-pointer text-sm font-normal text-foreground">
                {label}
            </Label>
        </div>
    );
}
