import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import CodeCompiler from '../components/CodeCompiler'
import './ContestView.css'

function ContestView({ user }) {
  const { contestId } = useParams()
  const navigate = useNavigate()
  const [contest, setContest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [isRegistered, setIsRegistered] = useState(false)
  const [loading, setLoading] = useState(true)
  const [timeLeft, setTimeLeft] = useState('')
  const [selectedQuestion, setSelectedQuestion] = useState(null)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }
    fetchContestData()
  }, [contestId, user])

  useEffect(() => {
    if (!contest) return

    const timer = setInterval(() => {
      const now = Date.now()
      const startTime = new Date(contest.start_time).getTime()
      const endTime = startTime + (2 * 60 * 60 * 1000)
      const diff = endTime - now

      if (diff <= 0) {
        setTimeLeft('Contest Ended')
        clearInterval(timer)
        return
      }

      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`)
    }, 1000)

    return () => clearInterval(timer)
  }, [contest])

  const fetchContestData = async () => {
    try {
      setLoading(true)

      // Fetch contest details
      const { data: contestData, error: contestError } = await supabase
        .from('contests')
        .select('*')
        .eq('id', contestId)
        .single()

      if (contestError) throw contestError
      setContest(contestData)

      // Check if user is registered
      const { data: registrationData, error: regError } = await supabase
        .from('contest_registrations')
        .select('id')
        .eq('contest_id', contestId)
        .eq('user_id', user.id)
        .single()

      if (regError && regError.code !== 'PGRST116') throw regError
      setIsRegistered(!!registrationData)

      // Fetch questions if registered
      if (registrationData) {
        const { data: questionsData, error: questionsError } = await supabase
          .from('contest_questions')
          .select('*')
          .eq('contest_id', contestId)
          .order('order_index', { ascending: true })

        if (questionsError) throw questionsError
        setQuestions(questionsData || [])
      }
    } catch (error) {
      console.error('Error fetching contest data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    try {
      const { error } = await supabase
        .from('contest_registrations')
        .insert({
          contest_id: contestId,
          user_id: user.id
        })

      if (error) throw error
      await fetchContestData()
    } catch (error) {
      console.error('Error registering:', error)
    }
  }

  const isContestRunning = () => {
    if (!contest) return false
    const now = Date.now()
    const startTime = new Date(contest.start_time).getTime()
    const endTime = startTime + (2 * 60 * 60 * 1000)
    return startTime <= now && endTime > now
  }

  const hasContestStarted = () => {
    if (!contest) return false
    return new Date(contest.start_time).getTime() <= Date.now()
  }

  if (loading) {
    return (
      <div className="contest-view-page">
        <div className="loading">Loading contest...</div>
      </div>
    )
  }

  if (!contest) {
    return (
      <div className="contest-view-page">
        <div className="error-message">Contest not found</div>
      </div>
    )
  }

  if (!isRegistered) {
    return (
      <div className="contest-view-page">
        <div className="registration-required">
          <div className="lock-icon">🔒</div>
          <h2>Registration Required</h2>
          <p>You must register for this contest to view the questions</p>
          <div className="contest-info">
            <h3>{contest.title}</h3>
            <p>{new Date(contest.start_time).toLocaleString()}</p>
          </div>
          {hasContestStarted() ? (
            <p className="contest-started-msg">This contest has already started</p>
          ) : (
            <button onClick={handleRegister} className="btn-register-now">
              Register Now
            </button>
          )}
        </div>
      </div>
    )
  }

  if (!hasContestStarted()) {
    return (
      <div className="contest-view-page">
        <div className="contest-not-started">
          <div className="clock-icon">⏰</div>
          <h2>Contest Hasn't Started Yet</h2>
          <p>You're registered! Come back when the contest begins.</p>
          <div className="contest-info">
            <h3>{contest.title}</h3>
            <p>Starts: {new Date(contest.start_time).toLocaleString()}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="contest-view-page">
      <div className="contest-header-bar">
        <div className="contest-title-section">
          <h1>{contest.title}</h1>
          <span className={`contest-status ${isContestRunning() ? 'live' : 'ended'}`}>
            {isContestRunning() ? '🔴 LIVE' : '⚫ ENDED'}
          </span>
        </div>
        <div className="contest-timer-section">
          <span className="timer-label">Time Remaining:</span>
          <span className="timer-value">{timeLeft}</span>
        </div>
      </div>

      <div className="contest-content">
        {/* Questions Selector */}
        <div className="questions-selector">
          <h3>Problems ({questions.length})</h3>
          <div className="questions-tabs">
            {questions.map((q, index) => (
              <button
                key={q.id}
                className={`question-tab ${selectedQuestion?.id === q.id ? 'active' : ''}`}
                onClick={() => setSelectedQuestion(q)}
              >
                <span className="tab-number">Q{index + 1}</span>
                <span className="tab-title">{q.title}</span>
                <span className={`tab-difficulty ${q.difficulty}`}>{q.difficulty}</span>
              </button>
            ))}
          </div>
        </div>

        {selectedQuestion ? (
          <div className="split-view">
            {/* Left Side - Question Details */}
            <div className="question-panel">
              <div className="question-header">
                <h2>{selectedQuestion.title}</h2>
                <div className="question-badges">
                  <span className={`difficulty-badge ${selectedQuestion.difficulty}`}>
                    {selectedQuestion.difficulty}
                  </span>
                  <span className="points-badge">{selectedQuestion.points} points</span>
                </div>
              </div>

              <div className="question-description">
                <h3>Problem Description</h3>
                <div 
                  className="problem-content"
                  dangerouslySetInnerHTML={{ __html: selectedQuestion.description }}
                />
              </div>
            </div>

            {/* Right Side - Code Compiler */}
            <div className="compiler-panel">
              <div className="compiler-header-title">
                <h3>💻 Code Editor</h3>
              </div>
              <CodeCompiler 
                questionId={selectedQuestion.id} 
                testCases={selectedQuestion.test_cases || []}
              />
            </div>
          </div>
        ) : (
          <div className="no-question-selected">
            <div className="select-icon">👆</div>
            <h3>Select a problem to start</h3>
            <p>Choose a problem from above to view details and write your solution</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ContestView
