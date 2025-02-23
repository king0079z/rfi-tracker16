import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

interface EvaluatorCardProps {
  evaluator: {
    email?: string
    name?: string
    role?: string
  }
  score?: number
  compact?: boolean
}

export function EvaluatorCard({ evaluator, score, compact = false }: EvaluatorCardProps) {
  if (!evaluator?.email) return null

  const getInitials = (name: string, email: string) => {
    if (name && name.trim()) {
      return name.split(' ').map(part => part[0]?.toUpperCase()).join('').slice(0, 2)
    }
    return email
      .split('@')[0]
      .split('.')
      .map(part => part[0]?.toUpperCase())
      .join('')
      .slice(0, 2)
  }

  const getAvatarUrl = (email: string) => {
    // Ensure email is encoded properly for URL
    const encodedEmail = encodeURIComponent(email.toLowerCase().trim())
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodedEmail}&radius=50&backgroundColor=2563eb&chars=2&size=128`
  }

  const initials = getInitials(evaluator.name || '', evaluator.email)
  const avatarUrl = getAvatarUrl(evaluator.email)

  return (
    <div className={`flex items-center justify-between ${compact ? 'p-2' : 'p-4'} bg-gray-50 rounded-lg`}>
      <div className="flex items-center gap-3">
        <Avatar className={compact ? "h-8 w-8" : "h-10 w-10"}>
          <AvatarImage src={getAvatarUrl(evaluator.email)} alt={evaluator.name || evaluator.email} />
          <AvatarFallback className="bg-primary text-primary-foreground">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className={`${compact ? 'text-sm' : 'text-base'} font-medium`}>
            {evaluator.name || evaluator.email.split('@')[0]}
          </p>
          <p className="text-xs text-muted-foreground capitalize">
            {evaluator.role?.toLowerCase().replace(/_/g, ' ') || 'Evaluator'}
          </p>
        </div>
      </div>
      {typeof score === 'number' && (
        <Badge 
          variant={score >= 75 ? "default" : score >= 50 ? "secondary" : "destructive"} 
          className={`ml-auto ${score >= 75 ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
            score >= 50 ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200' : 
            'bg-red-100 text-red-800 hover:bg-red-200'}`}
        >
          {score.toFixed(1)}%
        </Badge>
      )}
    </div>
  )
}