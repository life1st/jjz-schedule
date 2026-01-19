import React from 'react'
import './ActionButton.scss'

export interface ActionItemProps {
  label: React.ReactNode
  onClick: () => void
  active?: boolean
  disabled?: boolean
  loading?: boolean
  title?: string
  className?: string
  labelPrefix?: React.ReactNode
}

export const ActionItem = ({
  label,
  onClick,
  active,
  disabled,
  loading,
  title,
  className = '',
  labelPrefix
}: ActionItemProps) => {
  return (
    <button
      className={`action-btn ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      title={title}
      disabled={disabled || loading}
    >
      {!loading && labelPrefix}
      {loading && <span className="loading-icon">⌛</span>}
      {label}
    </button>
  )
}

interface ActionGroupProps {
  children: React.ReactNode
  className?: string
}

export const ActionGroup = ({ children, className = '' }: ActionGroupProps) => {
  return <div className={`action-group ${className}`}>{children}</div>
}

interface ActionToolbarProps {
  children: React.ReactNode
  className?: string
}

export const ActionToolbar = ({ children, className = '' }: ActionToolbarProps) => {
  // Flatten and count children to determine if it's a single button or not
  const childrenArray = React.Children.toArray(children)

  // Count total buttons to decide on .is-single or .is-group
  let totalItems = 0
  childrenArray.forEach(child => {
    if (React.isValidElement(child)) {
      if (child.type === ActionGroup) {
        totalItems += React.Children.count((child.props as any).children)
      } else {
        totalItems += 1
      }
    }
  })

  return (
    <div className={`action-container ${className} ${totalItems > 1 ? 'is-group' : 'is-single'}`}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          // Wrap loose ActionItems in an ActionGroup automatically if they aren't already
          if (child.type === ActionItem) {
            return <ActionGroup>{child}</ActionGroup>
          }
          return child
        }
        return null
      })}
    </div>
  )
}
