"use client"

import { useState, type ComponentProps } from "react"
import { useRouter } from "next/navigation"
import { MessageSquareIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useI18n } from "@/i18n/provider"

type SupportChatEntryButtonProps = {
  variant?: ComponentProps<typeof Button>["variant"]
  size?: ComponentProps<typeof Button>["size"]
  className?: string
}

// SupportChatEntryButton opens a dialog that asks for a channel ID and then
// navigates to that channel's visitor chat. The channel is entered at runtime
// so the entry never hard-binds to a specific channel.
export function SupportChatEntryButton({
  variant = "default",
  size = "sm",
  className,
}: SupportChatEntryButtonProps) {
  const t = useI18n()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [channelId, setChannelId] = useState("")

  const trimmed = channelId.trim()

  const submit = () => {
    if (!trimmed) {
      return
    }
    setOpen(false)
    router.push(`/support/chat?channelId=${encodeURIComponent(trimmed)}`)
  }

  return (
    <>
      <Button
        type="button"
        variant={variant}
        size={size}
        className={className}
        onClick={() => setOpen(true)}
      >
        <MessageSquareIcon className="size-4" />
        {t("supportPublic.chatEntry.label")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{t("supportPublic.chatEntry.dialogTitle")}</DialogTitle>
            <DialogDescription>{t("supportPublic.chatEntry.dialogDescription")}</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label htmlFor="support-chat-channel-id">
              {t("supportPublic.chatEntry.channelIdLabel")}
            </Label>
            <Input
              id="support-chat-channel-id"
              value={channelId}
              onChange={(event) => setChannelId(event.target.value)}
              placeholder={t("supportPublic.chatEntry.channelIdPlaceholder")}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault()
                  submit()
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="button" onClick={submit} disabled={!trimmed}>
              {t("supportPublic.chatEntry.enter")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
