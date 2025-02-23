import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { ThumbsUp, ThumbsDown, Loader2, CheckCircle2, XCircle, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'

interface VendorVotingProps {
  vendorId: number
  vendorName: string
}

interface VoteStats {
  totalVotes: number
  acceptVotes: number
  rejectVotes: number
  userVote: string | null
  finalDecision: string | null
  voters: Array<{
    name: string
    role: string
    vote: string
  }>
}

export function VendorVoting({ vendorId, vendorName }: VendorVotingProps) {
  const [evaluationScore, setEvaluationScore] = useState<number | null>(null)
  const [voteStats, setVoteStats] = useState<VoteStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isVoting, setIsVoting] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchEvaluationScore()
    fetchVoteStats()
  }, [vendorId])

  // Function to refresh vote stats
  const refreshVotes = () => {
    fetchVoteStats()
    fetchEvaluationScore()
  }

  const getAuthToken = () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setError('You must be logged in to access this feature')
      return null
    }
    return token
  }

  const fetchEvaluationScore = async () => {
    const token = getAuthToken()
    if (!token) return

    try {
      const response = await fetch(`/api/evaluations/${vendorId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      const data = await response.json()
      setEvaluationScore(data.summary.averageScore || 0)
      setError(null)
    } catch (error) {
      console.error('Error fetching evaluation score:', error)
      setError('Failed to load evaluation score')
      toast({
        title: 'Error',
        description: 'Failed to load evaluation score',
        variant: 'destructive',
      })
    }
  }

  const fetchVoteStats = async () => {
    const token = getAuthToken()
    if (!token) return

    try {
      const response = await fetch(`/api/vendors/${vendorId}/vote`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error(response.statusText)
      }
      const data = await response.json()
      setVoteStats(data)
      setError(null)
    } catch (error) {
      console.error('Error fetching vote stats:', error)
      setError('Failed to load voting statistics')
      toast({
        title: 'Error',
        description: 'Failed to load voting statistics',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  const clearVote = async () => {
    const token = getAuthToken()
    if (!token) return

    setIsVoting(true)
    try {
      const response = await fetch(`/api/vendors/${vendorId}/vote`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      })

      if (!response.ok) {
        throw new Error(response.statusText)
      }
      
      await fetchVoteStats()
      setError(null)

      toast({
        title: 'Success',
        description: 'Your vote has been cleared',
      })
    } catch (error) {
      console.error('Error clearing vote:', error)
      setError('Failed to clear vote')
      toast({
        title: 'Error',
        description: 'Failed to clear vote',
        variant: 'destructive',
      })
    } finally {
      setIsVoting(false)
    }
  }

  const submitVote = async (vote: 'ACCEPT' | 'REJECT') => {
    const token = getAuthToken()
    if (!token) return

    setIsVoting(true)
    try {
      const response = await fetch(`/api/vendors/${vendorId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ vote }),
      })

      if (!response.ok) {
        throw new Error(response.statusText)
      }
      
      await fetchVoteStats()
      setError(null)

      toast({
        title: 'Success',
        description: 'Your vote has been recorded',
      })
    } catch (error) {
      console.error('Error submitting vote:', error)
      setError('Failed to submit vote')
      toast({
        title: 'Error',
        description: 'Failed to submit vote',
        variant: 'destructive',
      })
    } finally {
      setIsVoting(false)
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-500'
    if (score >= 0.6) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getProgressColor = (score: number) => {
    if (score >= 0.8) return 'bg-green-500'
    if (score >= 0.6) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Evaluation Score</CardTitle>
        </CardHeader>
        <CardContent>
          {evaluationScore !== null ? (
            <div className="space-y-2">
              <div className={cn(
                "text-3xl font-bold",
                getScoreColor(evaluationScore)
              )}>
                {evaluationScore.toFixed(1)}%
              </div>
              <Progress 
                value={evaluationScore * 100} 
                className="h-2"
                indicatorClassName={getProgressColor(evaluationScore)}
              />
            </div>
          ) : (
            <div className="text-muted-foreground">
              No evaluations yet
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Decision Making</CardTitle>
        </CardHeader>
        <CardContent>
          {voteStats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Accept</div>
                  <div className="text-2xl font-semibold text-green-500">
                    {voteStats.acceptVotes}
                  </div>
                  <Progress 
                    value={(voteStats.acceptVotes / (voteStats.totalVotes || 1)) * 100}
                    className="h-1.5"
                    indicatorClassName="bg-green-500"
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">Reject</div>
                  <div className="text-2xl font-semibold text-red-500">
                    {voteStats.rejectVotes}
                  </div>
                  <Progress 
                    value={(voteStats.rejectVotes / (voteStats.totalVotes || 1)) * 100}
                    className="h-1.5"
                    indicatorClassName="bg-red-500"
                  />
                </div>
              </div>

              {/* Voter List */}
              <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium mb-3">Voters</h4>
                <ScrollArea className="h-[120px]">
                  <div className="space-y-2">
                    {voteStats.voters.map((voter, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span>{voter.name}</span>
                          <Badge variant="secondary" className="text-xs">
                            {voter.role.toLowerCase().replace('_', ' ')}
                          </Badge>
                        </div>
                        <Badge variant={voter.vote === 'ACCEPT' ? 'success' : 'destructive'}>
                          {voter.vote.toLowerCase()}
                        </Badge>
                      </div>
                    ))}
                    {voteStats.voters.length === 0 && (
                      <div className="text-sm text-muted-foreground text-center py-2">
                        No votes yet
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </div>

              {voteStats.finalDecision ? (
                <div className={cn(
                  "p-4 rounded-lg border flex items-center gap-3",
                  voteStats.finalDecision === 'ACCEPTED' 
                    ? "bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900" 
                    : "bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900"
                )}>
                  {voteStats.finalDecision === 'ACCEPTED' ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <div className="text-sm text-muted-foreground">Final Decision</div>
                    <div className="font-semibold">
                      {voteStats.finalDecision === 'ACCEPTED' ? 'Accepted' : 'Rejected'}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => submitVote('ACCEPT')}
                      variant={voteStats.userVote === 'ACCEPT' ? 'default' : 'outline'}
                      className="flex-1 h-12"
                      disabled={isVoting}
                    >
                      {isVoting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Accept
                        </>
                      )}
                    </Button>
                    <Button
                      onClick={() => submitVote('REJECT')}
                      variant={voteStats.userVote === 'REJECT' ? 'default' : 'outline'}
                      className="flex-1 h-12"
                      disabled={isVoting}
                    >
                      {isVoting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          Reject
                        </>
                      )}
                    </Button>
                  </div>

                  {voteStats.userVote && (
                    <Button
                      onClick={clearVote}
                      variant="ghost"
                      className="w-full"
                      disabled={isVoting}
                    >
                      {isVoting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Clear my vote'
                      )}
                    </Button>
                  )}

                  <div className="text-sm text-center text-muted-foreground">
                    {voteStats.totalVotes} total votes
                    {voteStats.totalVotes < 3 && (
                      <div className="mt-1 text-xs">
                        {3 - voteStats.totalVotes} more votes needed for decision
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}