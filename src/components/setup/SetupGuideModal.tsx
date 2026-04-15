import { Modal } from '@/components/shared/Modal/Modal'
import clsx from 'clsx'
import { PropsWithChildren } from 'react'

interface SetupGuideModalProps {
  isOpen: boolean
  onClose: () => void
}

interface StepProps {
  number: number
  title: string
  note?: string
  hideBorder?: boolean
}

function Step({ number, title, children, note, hideBorder = false }: PropsWithChildren<StepProps>) {
  return (
    <div className='px-6'>
      <div className={clsx('flex py-5 gap-5', !hideBorder && 'border-t border-border')}>
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-dm-subtle text-dm font-display text-base font-bold flex items-center justify-center">
          {number}
        </div>
        <div className="flex flex-col gap-2 min-w-0 pt-1">
          <p className="text-sm font-display font-semibold text-text-primary">{title}</p>
          <div className="text-sm text-text-secondary leading-base">{children}</div>
          {note && (
            <p className="text-xs text-text-muted mt-1 italic">{note}</p>
          )}
        </div>
      </div>
    </div>
  )
}

interface ExternalLinkProps {
  href: string
}

function ExternalLink({ href, children }: PropsWithChildren<ExternalLinkProps>) {
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

const SetupGuideModalTitle = () => {
  return (
    <h3 className="pl-3 py-2">Setting Up Campaign Manager</h3>)
}

export function SetupGuideModal({ isOpen, onClose }: SetupGuideModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={<SetupGuideModalTitle />} size="md">
      <div className="flex flex-col pb-2">
        <Step number={1} title="Create the data repo" hideBorder>
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
