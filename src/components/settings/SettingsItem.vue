<script setup lang="ts">
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useId, type Component } from 'vue'

interface Option {
  label: string
  value: string
}

export interface SettingsItemProps {
  label: string
  description?: string
  type?: 'input' | 'password' | 'select'
  placeholder?: string
  options?: Option[]
  icon?: Component
}

withDefaults(defineProps<SettingsItemProps>(), {
  type: 'input',
})

const modelValue = defineModel<string>()

const id = useId()
</script>

<template>
  <div class="space-y-1.5">
    <Label :for="id" class="text-muted-foreground flex items-center gap-1.5 text-sm font-medium">
      <component :is="icon" v-if="icon" class="size-4 shrink-0" />
      {{ label }}
    </Label>

    <template v-if="type === 'input' || type === 'password'">
      <Input :id="id" v-model="modelValue" :type="type" :placeholder="placeholder" />
    </template>

    <template v-else-if="type === 'select'">
      <Select v-model="modelValue">
        <SelectTrigger :id="id">
          <SelectValue>
            {{ options?.find((opt) => opt.value === modelValue)?.label || placeholder }}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem v-for="opt in options" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </template>

    <p v-if="description" class="text-sm text-muted-foreground">
      {{ description }}
    </p>
  </div>
</template>
