import { Controller, type Control, type UseFieldArrayReturn, type FieldValues, type Path, type FieldArray, type ArrayPath } from 'react-hook-form'
import { PlusIcon, TrashIcon } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface KeyValueEditorProps {
  control: Control<FieldValues>
  fieldArray: UseFieldArrayReturn<FieldValues>
  name: string
  addLabel: string
}

export function KeyValueEditor({ control, fieldArray, name, addLabel }: KeyValueEditorProps) {
  return (
    <div className="flex flex-col gap-3">
      {fieldArray.fields.map((item, index) => (
        <div key={item.id} className="flex gap-2 items-start">
          <Controller
            control={control}
            name={`${name}.${index}.key` as Path<FieldValues>}
            render={({ field }) => <Input {...field} placeholder="Key" />}
          />
          <Controller
            control={control}
            name={`${name}.${index}.value` as Path<FieldValues>}
            render={({ field }) => <Input {...field} placeholder="Value" />}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => fieldArray.remove(index)}
            className="text-destructive flex-shrink-0"
          >
            <TrashIcon />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => fieldArray.append({ key: '', value: '' } as FieldArray<FieldValues, ArrayPath<FieldValues>>)}
        className="w-fit"
      >
        <PlusIcon data-icon="inline-start" />
        {addLabel}
      </Button>
    </div>
  )
}
