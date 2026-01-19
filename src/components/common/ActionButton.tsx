import React from 'react'
import './ActionButton.scss'

export interface ActionItem {
  label: React.ReactNode
  onClick: () => void
  active?: boolean
  title?: string
  className?: string
}

interface ActionButtonProps {
  actions: ActionItem[] | ActionItem[][]
  className?: string
}

export const ActionButton = ({ actions, className = '' }: ActionButtonProps) => {
  // Normalize actions to ActionItem[][]
  const groups = Array.isArray(actions[0])
    ? (actions as ActionItem[][])
    : [actions as ActionItem[]]

  const totalActions = groups.reduce((acc, group) => acc + group.length, 0)

  return (
    <div className={`action-container ${className} ${totalActions > 1 ? 'is-group' : 'is-single'}`}>
      {groups.map((group, groupIndex) => (
        <div key={groupIndex} className="action-group">
          {group.map((item, itemIndex) => (
            <button
              key={itemIndex}
              className={`action-btn ${item.active ? 'active' : ''} ${item.className || ''}`}
              onClick={item.onClick}
              title={item.title}
            >
              {item.label}
            </button>
          ))}
        </div>
      ))}
    </div>
  )
}
