"use client";

import type React from "react";

import { useState } from "react";
import {
  Moon,
  Sun,
  Laptop,
  Trash2,
  Download,
  Upload,
  Info,
  Keyboard,
  Palette,
  Clipboard,
  ListTodo,
  HelpCircle,
  ExternalLink,
  Settings as SettingsIcon,
} from "lucide-react";
import {
  Button,
  Dialog,
  Flex,
  RadioGroup,
  ScrollArea,
  Select,
  Slider,
  Switch,
  Text,
} from "@radix-ui/themes";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../shared/Accordion";
import { DatabaseStatus } from "../shared/DatabaseStatus";

// Default settings
const defaultSettings = {
  general: {
    theme: "system",
    startWithSystem: true,
    minimizeToTray: true,
    showNotifications: true,
  },
  clipboard: {
    maxItems: 50,
    retentionDays: 7,
    saveImages: true,
    saveFiles: true,
    groupDuplicates: true,
    autoDeleteAfterCopy: false,
  },
  todo: {
    showCompletedTasks: true,
    defaultPriority: "medium",
    enableReminders: false,
    defaultReminderTime: "1day",
  },
  shortcuts: {
    openApp: "Ctrl+Shift+C",
    quickPaste: "Ctrl+Shift+V",
    clearClipboard: "Ctrl+Shift+X",
  },
};

export default function SettingsView() {
  const [settings, setSettings] = useState(defaultSettings);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Update a specific setting
  const updateSetting = (category: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value,
      },
    }));
  };

  // Reset all settings to default
  const resetSettings = () => {
    setSettings(defaultSettings);
    setShowResetDialog(false);
  };

  // Export settings as JSON
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);

    const exportFileDefaultName = "clipboard-manager-settings.json";

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  // Simulate importing settings
  const importSettings = () => {
    // In a real app, this would open a file picker
    // For now, we'll just show a success message
    alert("Settings imported successfully!");
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-zinc-200 bg-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-zinc-400 to-zinc-700 flex items-center justify-center">
            <SettingsIcon className="h-4 w-4 text-white" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-800">Settings</h1>
        </div>
        <p className="text-sm text-zinc-500 mt-1">
          Customize your clipboard manager
        </p>
      </div>

      {/* Settings content */}
      <ScrollArea style={{ height: 450 }}>
        <div className="p-4">
          <Accordion
            type="single"
            collapsible
            className="w-full"
            defaultValue="general"
          >
            {/* General Settings */}
            <SettingsSection
              id="general"
              title="General"
              icon={<Palette className="h-4 w-4 mr-2" />}
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-700">Theme</h3>
                  <RadioGroup.Root
                    value={settings.general.theme}
                    onValueChange={(value) =>
                      updateSetting("general", "theme", value)
                    }
                  >
                    <Flex align={"center"} gap={"4"}>
                      <RadioGroup.Item value="light" id="theme-light">
                        <Flex align={"center"}>
                          <Sun className="h-4 w-4 mr-1" />
                          <Text>Light</Text>
                        </Flex>
                      </RadioGroup.Item>
                      <RadioGroup.Item value="dark" id="theme-dark">
                        <Flex align={"center"}>
                          <Moon className="h-4 w-4 mr-1" />
                          <Text> Dark</Text>
                        </Flex>
                      </RadioGroup.Item>
                      <RadioGroup.Item value="system" id="theme-system">
                        <Flex align={"center"}>
                          <Laptop className="h-4 w-4 mr-1" />
                          <Text>System</Text>
                        </Flex>
                      </RadioGroup.Item>
                    </Flex>
                  </RadioGroup.Root>
                </div>

                <SettingsToggle
                  label="Start with system"
                  description="Launch automatically when you log in"
                  checked={settings.general.startWithSystem}
                  onCheckedChange={(checked) =>
                    updateSetting("general", "startWithSystem", checked)
                  }
                />

                <SettingsToggle
                  label="Minimize to tray"
                  description="Keep running in the background when closed"
                  checked={settings.general.minimizeToTray}
                  onCheckedChange={(checked) =>
                    updateSetting("general", "minimizeToTray", checked)
                  }
                />

                <SettingsToggle
                  label="Show notifications"
                  description="Display notifications for important events"
                  checked={settings.general.showNotifications}
                  onCheckedChange={(checked) =>
                    updateSetting("general", "showNotifications", checked)
                  }
                />
              </div>
            </SettingsSection>

            {/* Clipboard Settings */}
            <SettingsSection
              id="clipboard"
              title="Clipboard"
              icon={<Clipboard className="h-4 w-4 mr-2" />}
            >
              <div className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-zinc-700">
                        Maximum clipboard items
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Limit the number of items stored in history
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {settings.clipboard.maxItems}
                    </span>
                  </div>
                  <Slider
                    value={[settings.clipboard.maxItems]}
                    min={10}
                    max={200}
                    step={10}
                    onValueChange={(value) =>
                      updateSetting("clipboard", "maxItems", value[0])
                    }
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-medium text-zinc-700">
                        Retention period (days)
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Automatically delete items older than this
                      </p>
                    </div>
                    <span className="text-sm font-medium">
                      {settings.clipboard.retentionDays} days
                    </span>
                  </div>
                  <Slider
                    value={[settings.clipboard.retentionDays]}
                    min={1}
                    max={30}
                    step={1}
                    onValueChange={(value) =>
                      updateSetting("clipboard", "retentionDays", value[0])
                    }
                  />
                </div>

                <SettingsToggle
                  label="Save images"
                  description="Store images in clipboard history"
                  checked={settings.clipboard.saveImages}
                  onCheckedChange={(checked) =>
                    updateSetting("clipboard", "saveImages", checked)
                  }
                />

                <SettingsToggle
                  label="Save files"
                  description="Store file references in clipboard history"
                  checked={settings.clipboard.saveFiles}
                  onCheckedChange={(checked) =>
                    updateSetting("clipboard", "saveFiles", checked)
                  }
                />

                <SettingsToggle
                  label="Group duplicates"
                  description="Combine identical clipboard entries"
                  checked={settings.clipboard.groupDuplicates}
                  onCheckedChange={(checked) =>
                    updateSetting("clipboard", "groupDuplicates", checked)
                  }
                />

                <SettingsToggle
                  label="Auto-delete after copy"
                  description="Remove items from history after they're copied"
                  checked={settings.clipboard.autoDeleteAfterCopy}
                  onCheckedChange={(checked) =>
                    updateSetting("clipboard", "autoDeleteAfterCopy", checked)
                  }
                />
              </div>
            </SettingsSection>

            {/* Todo Settings */}
            <SettingsSection
              id="todo"
              title="Todo List"
              icon={<ListTodo className="h-4 w-4 mr-2" />}
            >
              <div className="space-y-6">
                <SettingsToggle
                  label="Show completed tasks"
                  description="Display completed tasks in the list"
                  checked={settings.todo.showCompletedTasks}
                  onCheckedChange={(checked) =>
                    updateSetting("todo", "showCompletedTasks", checked)
                  }
                />

                <div className="space-y-2">
                  <Text
                    htmlFor="default-priority"
                    className="text-sm font-medium text-zinc-700"
                  >
                    Default priority
                  </Text>
                  <Select.Root
                    value={settings.todo.defaultPriority}
                    onValueChange={(value) =>
                      updateSetting("todo", "defaultPriority", value)
                    }
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="low">Low</Select.Item>
                      <Select.Item value="medium">Medium</Select.Item>
                      <Select.Item value="high">High</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </div>

                <SettingsToggle
                  label="Enable reminders"
                  description="Get notified about upcoming tasks"
                  checked={settings.todo.enableReminders}
                  onCheckedChange={(checked) =>
                    updateSetting("todo", "enableReminders", checked)
                  }
                />

                <div className="space-y-2">
                  <Text>Default reminder time</Text>
                  <Select.Root
                    value={settings.todo.defaultReminderTime}
                    onValueChange={(value) =>
                      updateSetting("todo", "defaultReminderTime", value)
                    }
                    disabled={!settings.todo.enableReminders}
                  >
                    <Select.Trigger />
                    <Select.Content>
                      <Select.Item value="30min">30 minutes before</Select.Item>
                      <Select.Item value="1hour">1 hour before</Select.Item>
                      <Select.Item value="3hours">3 hours before</Select.Item>
                      <Select.Item value="1day">1 day before</Select.Item>
                    </Select.Content>
                  </Select.Root>
                </div>
              </div>
            </SettingsSection>

            {/* Shortcuts Settings */}
            <SettingsSection
              id="shortcuts"
              title="Keyboard Shortcuts"
              icon={<Keyboard className="h-4 w-4 mr-2" />}
            >
              <div className="space-y-4">
                <p className="text-sm text-zinc-500">
                  Configure keyboard shortcuts for quick access to common
                  actions.
                </p>

                <ShortcutSetting
                  label="Open application"
                  shortcut={settings.shortcuts.openApp}
                  onEdit={() => {}}
                />

                <ShortcutSetting
                  label="Quick paste"
                  shortcut={settings.shortcuts.quickPaste}
                  onEdit={() => {}}
                />

                <ShortcutSetting
                  label="Clear clipboard"
                  shortcut={settings.shortcuts.clearClipboard}
                  onEdit={() => {}}
                />

                <div className="pt-2">
                  <Button variant="outline">Reset to defaults</Button>
                </div>
              </div>
            </SettingsSection>

            {/* System Settings */}
            <SettingsSection
              id="system"
              title="System"
              icon={<Info className="h-4 w-4 mr-2" />}
            >
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-zinc-700">
                    Database Status
                  </h3>
                  <DatabaseStatus />
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-zinc-700">
                    Data Management
                  </h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      color="red"
                      onClick={() => setShowResetDialog(true)}
                      className="w-full justify-start"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Data
                    </Button>
                    <Button
                      variant="outline"
                      onClick={exportSettings}
                      className="w-full justify-start"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Settings
                    </Button>
                    <Button
                      variant="outline"
                      onClick={importSettings}
                      className="w-full justify-start"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Settings
                    </Button>
                  </div>
                </div>
              </div>
            </SettingsSection>

            {/* About Section */}
            <SettingsSection
              id="about"
              title="About"
              icon={<Info className="h-4 w-4 mr-2" />}
            >
              <div className="space-y-6">
                <div className="flex flex-col items-center justify-center py-4">
                  <div className="w-16 h-16 mb-4">
                    <img
                      src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/app-icon-CxDWu6HSLFsSScnkZt6rVJSWB1i2kC.png"
                      alt="Clipboard Manager"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <h2 className="text-lg font-semibold text-zinc-800">
                    Clipboard Manager
                  </h2>
                  <p className="text-sm text-zinc-500">Version 1.0.0</p>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="credits">
                    <AccordionTrigger className="text-sm py-2">
                      Credits
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2 text-sm text-zinc-600">
                        <p>Icons: Lucide Icons</p>
                        <p>UI Components: shadcn/ui</p>
                        <p>Emoji Picker: emoji-picker-react</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="privacy">
                    <AccordionTrigger className="text-sm py-2">
                      Privacy
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-sm text-zinc-600">
                        All your clipboard data is stored locally on your
                        device. We don't collect or transmit any of your
                        clipboard contents.
                      </p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="help">
                    <AccordionTrigger className="text-sm py-2">
                      Help & Support
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <Button className="h-auto p-0 text-sm text-zinc-600">
                          <HelpCircle className="h-3.5 w-3.5 mr-1" />
                          View Documentation
                        </Button>
                        <Button className="h-auto p-0 text-sm text-zinc-600">
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          Visit Website
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                <div className="pt-4 space-y-3">
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                    onClick={exportSettings}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                    onClick={importSettings}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Settings
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => setShowResetDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Reset All Settings
                  </Button>
                </div>
              </div>
            </SettingsSection>
          </Accordion>
        </div>
      </ScrollArea>

      {/* Reset confirmation dialog */}
      <Dialog.Root open={showResetDialog} onOpenChange={setShowResetDialog}>
        <Dialog.Content>
          <Dialog.Title>Reset all settings?</Dialog.Title>
          <Dialog.Description>
            This will restore all settings to their default values. This action
            cannot be undone.
          </Dialog.Description>
          <Flex>
            <Button variant="outline" onClick={() => setShowResetDialog(false)}>
              Cancel
            </Button>
            <Button onClick={resetSettings}>Reset Settings</Button>
          </Flex>
        </Dialog.Content>
      </Dialog.Root>
    </div>
  );
}

// Settings toggle component
function SettingsToggle({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5 pr-2">
        <Text>{label}</Text>
        <p className="text-xs text-zinc-500">{description}</p>
      </div>
      <Switch id={label} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

// Settings section using accordion
function SettingsSection({
  id,
  title,
  icon,
  children,
}: {
  id: string;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <AccordionItem value={id} className="border-b border-zinc-200">
      <AccordionTrigger className="hover:no-underline py-3">
        <span className="flex items-center text-sm font-medium">
          {icon}
          {title}
        </span>
      </AccordionTrigger>
      <AccordionContent className="pt-2 pb-4">{children}</AccordionContent>
    </AccordionItem>
  );
}

// Keyboard shortcut setting component
function ShortcutSetting({
  label,
  shortcut,
  onEdit,
}: {
  label: string;
  shortcut: string;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-100">
      <span className="text-sm text-zinc-700">{label}</span>
      <Button
        variant="outline"
        className="h-7 text-xs font-mono bg-zinc-50"
        onClick={onEdit}
      >
        {shortcut}
      </Button>
    </div>
  );
}
