// src/components/setup/SetupGuideModal.tsx
import { Modal } from '@/components/shared/Modal/Modal'

interface SetupGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

interface StepProps {
  number: number
  title: string
  children: React.ReactNode
  note?: string
}

function Step({ number, title, children, note }: StepProps) {
  return (
    <div className="flex gap-4 p-4 border-b border-border last:border-b-0">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-dm-subtle text-dm text-sm font-semibold flex items-center justify-center">
        {number}
      </div>
      <div className="flex flex-col gap-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary">{title}</p>
        <div className="text-sm text-text-secondary leading-base">{children}</div>
        {note && (
          <p className="text-xs text-text-muted mt-1 italic">{note}</p>
        )}
      </div>
    </div>
  )
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="text-dm hover:underline break-all"
    >
      {children}
    </a>
  )
}

export function SetupGuideModal({ isOpen, onClose }: SetupGuideModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Setting Up Campaign Manager" size="md">
      <div className="flex flex-col">
        <Step number={1} title="Create the data repo">
          <p>
            Go to{' '}
            <ExternalLink href="https://github.com/new">github.com/new</ExternalLink>
            {' '}and create a new empty repository. This is where all campaign data lives.
          </p>
          <p className="mt-1">Share the repository owner name and repo name with your whole group.</p>
        </Step>

        <Step
          number={2}
          title="Invite your group"
          note="Skip this step if you are the repo owner."
        >
          <p>Go to your repo → Settings → Collaborators → Add people.</p>
          <p className="mt-1">Invite each DM and player by GitHub username. Each person must accept the invitation before creating their token.</p>
        </Step>

        <Step number={3} title="Create your Personal Access Token">
          <p>
            Go to{' '}
            <ExternalLink href="https://github.com/settings/personal-access-tokens/new">
              settings/personal-access-tokens/new
            </ExternalLink>
            {' '}and create a Fine-grained token.
          </p>
          <ul className="mt-2 flex flex-col gap-1 list-disc list-inside">
            <li>Repository access: select only the shared campaign repo</li>
            <li>Permissions → Contents: Read and Write</li>
          </ul>
          <p className="mt-2 text-xs text-text-muted italic">
            If your organization does not support fine-grained tokens, create a classic token at{' '}
            <ExternalLink href="https://github.com/settings/tokens/new">
              settings/tokens/new
            </ExternalLink>
            {' '}with the <code className="font-mono">repo</code> scope.
          </p>
        </Step>

        <Step number={4} title="Connect">
          <p>Enter the repo owner's GitHub username, the repo name, and your token into the form, then click Connect Repository.</p>
        </Step>
      </div>
    </Modal>
  )
}
