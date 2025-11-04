import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './ContestCard.css'

function ContestCard({ contest, user, onRegister, isPast, isRunning }) {
  const [timeLeft, setTimeLeft] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [loadingRegistration, setLoadingRegistration] = useState(false)

  useEffect(() => {
    if (isPast) return

    const timer = setInterval(() => {
      const now = Date.now()
      const diff = contest.startTime - now
      const endTime = contest.startTime + (2 * 60 * 60 * 1000) // 2 hours
      const timeUntilEnd = endTime - now

      if (diff <= 0 && timeUntilEnd > 0) {
        // Contest is running
        const hours = Math.floor(timeUntilEnd / (1000 * 60 * 60))
        const minutes = Math.floor((timeUntilEnd % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((timeUntilEnd % (1000 * 60)) / 1000)
        setTimeLeft(`Ends in ${hours}h ${minutes}m ${seconds}s`)
      } else if (diff > 0) {
        // Contest hasn't started
        const days = Math.floor(diff / (1000 * 60 * 60 * 24))
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        setTimeLeft(`Starts in ${days}d ${hours}h ${minutes}m`)
      } else {
        setTimeLeft('Contest ended')
        clearInterval(timer)
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [contest.startTime, isPast])

  useEffect(() => {
    checkRegistrationStatus()
  }, [contest.id, user])

  const checkRegistrationStatus = async () => {
    if (!user || !contest.id) return

    try {
      const { data, error } = await supabase
        .from('contest_registrations')
        .select('id')
        .eq('contest_id', contest.id)
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error checking registration:', error)
        return
      }

      setIsRegistered(!!data)
    } catch (error) {
      console.error('Error checking registration status:', error)
    }
  }

  const handleRegisterClick = async () => {
    if (!user || loadingRegistration) return

    setLoadingRegistration(true)
    try {
      await onRegister(contest.id)
      // Refresh registration status after registration/unregistration
      await checkRegistrationStatus()
    } finally {
      setLoadingRegistration(false)
    }
  }

  return (
    <div className="contest-card">
      <div className="contest-header" style={{ background: contest.gradient }}>
        <div className="contest-icon">💎</div>
      </div>
      
      <div className="contest-body">
        {!isPast && (
          <div className={`contest-timer ${isRunning ? 'running' : ''}`}>
            <span className="timer-icon">{isRunning ? '🔴' : '⏰'}</span>
            <span>{timeLeft}</span>
          </div>
        )}
        
        <h3 className="contest-title">{contest.title}</h3>
        <p className="contest-date">{contest.date}</p>
        
        {contest.registered && contest.registered.length > 0 && (
          <p className="registered-count">
            {contest.registered.length} participant{contest.registered.length !== 1 ? 's' : ''} registered
          </p>
        )}
        
        {user && contest.createdBy === user.id && !isPast && (
          <Link to={`/contest/${contest.id}/add-questions`} className="btn-add-questions">
            Add Questions
          </Link>
        )}
        
        {/* Show Enter Contest button for running contests */}
        {isRunning && user && (
          <Link to={`/contest/${contest.id}`} className="btn-view-contest">
            🚀 {isRegistered ? 'Enter Contest' : 'View Contest'}
          </Link>
        )}
        
        {/* Show View Contest link for registered users on upcoming contests */}
        {!isPast && !isRunning && user && isRegistered && (
          <Link to={`/contest/${contest.id}`} className="btn-view-questions">
            📋 View Contest
          </Link>
        )}
        
        {/* Show registration button for upcoming contests */}
        {!isPast && !isRunning && user && (
          <button
            className={`btn-register-contest ${isRegistered ? 'registered' : ''}`}
            onClick={handleRegisterClick}
            disabled={loadingRegistration}
          >
            {loadingRegistration ? '...' : (isRegistered ? '✓ Registered' : 'Register')}
          </button>
        )}
        
        {/* Show login prompt for non-authenticated users */}
        {!isPast && !user && (
          <p className="login-prompt">Login to register</p>
        )}
      </div>
    </div>
  )
}

export default ContestCard
