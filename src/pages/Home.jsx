import { useState, useEffect } from 'react'
import ContestCard from '../components/ContestCard'
import { supabase } from '../supabaseClient'
import './Home.css'

function Home({ user }) {
  const [contests, setContests] = useState([])
  const [activeTab, setActiveTab] = useState('running')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchContests()
  }, [])

  const fetchContests = async () => {
    try {
      setLoading(true)
      // Fetch contests with registration counts
      const { data: contestsData, error: contestsError } = await supabase
        .from('contests')
        .select(`
          *,
          contest_registrations(count)
        `)
        .order('start_time', { ascending: true })

      if (contestsError) throw contestsError

      // Transform the data to match the expected format
      const formattedContests = contestsData.map(contest => ({
        id: contest.id,
        title: contest.title,
        date: new Date(contest.start_time).toLocaleString('en-US', {
          weekday: 'long',
          hour: '2-digit',
          minute: '2-digit',
          timeZoneName: 'short'
        }),
        startTime: new Date(contest.start_time).getTime(),
        type: contest.type,
        description: contest.description,
        gradient: contest.gradient,
        registered: Array(contest.contest_registrations?.[0]?.count || 0)
          .fill()
          .map((_, i) => `user_${i}`), // Mock registered users for display
        createdBy: contest.created_by,
        createdByEmail: contest.created_by_email
      }))

      setContests(formattedContests)
    } catch (error) {
      console.error('Error fetching contests:', error)
      // Fallback to sample data if no contests exist yet
      if (error.message.includes('relation "contests" does not exist')) {
        const sampleContests = [
          {
            id: 'sample-1',
            title: 'Weekly Contest 475',
            date: 'Sunday 8:00 AM GMT+5:30',
            startTime: new Date('2024-12-08T08:00:00').getTime(),
            type: 'weekly',
            gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            registered: []
          },
          {
            id: 'sample-2',
            title: 'Biweekly Contest 169',
            date: 'Saturday 8:00 PM GMT+5:30',
            startTime: new Date('2024-12-07T20:00:00').getTime(),
            type: 'biweekly',
            gradient: 'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
            registered: []
          }
        ]
        setContests(sampleContests)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (contestId) => {
    if (!user) return

    try {
      // Check if user is already registered
      const { data: existingRegistration, error: checkError } = await supabase
        .from('contest_registrations')
        .select('id')
        .eq('contest_id', contestId)
        .eq('user_id', user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw checkError
      }

      if (existingRegistration) {
        // Unregister
        const { error: deleteError } = await supabase
          .from('contest_registrations')
          .delete()
          .eq('contest_id', contestId)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError
      } else {
        // Register
        const { error: insertError } = await supabase
          .from('contest_registrations')
          .insert({
            contest_id: contestId,
            user_id: user.id
          })

        if (insertError) throw insertError
      }

      // Refresh contests data
      await fetchContests()
    } catch (error) {
      console.error('Error updating registration:', error)
    }
  }

  const now = Date.now()
  const runningContests = contests.filter(c => {
    const endTime = c.startTime + (2 * 60 * 60 * 1000) // 2 hours
    return c.startTime <= now && endTime > now
  })
  const upcomingContests = contests.filter(c => c.startTime > now)
  const pastContests = contests.filter(c => {
    const endTime = c.startTime + (2 * 60 * 60 * 1000)
    return endTime <= now
  })

  if (loading) {
    return (
      <div className="home">
        <div className="hero">
          <div className="trophy-large">🏆</div>
          <h1 className="hero-title">
            <span className="brand">CodeArena</span> Challenges
          </h1>
          <p className="hero-subtitle">Contest every week. Compete and see your ranking!</p>
        </div>
        <div className="contests-section">
          <div className="container">
            <div className="loading">Loading contests...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="home">
      <div className="hero">
        <div className="trophy-large">🏆</div>
        <h1 className="hero-title">
          <span className="brand">CodeArena</span> Challenges
        </h1>
        <p className="hero-subtitle">Contest every week. Compete and see your ranking!</p>
      </div>

      <div className="contests-section">
        <div className="container">
          <div className="tabs">
            <button
              className={`tab ${activeTab === 'running' ? 'active' : ''}`}
              onClick={() => setActiveTab('running')}
            >
              Running Contests {runningContests.length > 0 && `(${runningContests.length})`}
            </button>
            <button
              className={`tab ${activeTab === 'upcoming' ? 'active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Contests
            </button>
            <button
              className={`tab ${activeTab === 'past' ? 'active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past Contests
            </button>
          </div>

          <div className="contests-grid">
            {activeTab === 'running' ? (
              runningContests.length > 0 ? (
                runningContests.map(contest => (
                  <ContestCard
                    key={contest.id}
                    contest={contest}
                    user={user}
                    isRunning={true}
                    onRegister={handleRegister}
                  />
                ))
              ) : (
                <p className="no-contests">No contests running right now</p>
              )
            ) : activeTab === 'upcoming' ? (
              upcomingContests.length > 0 ? (
                upcomingContests.map(contest => (
                  <ContestCard
                    key={contest.id}
                    contest={contest}
                    user={user}
                    onRegister={handleRegister}
                  />
                ))
              ) : (
                <p className="no-contests">No upcoming contests</p>
              )
            ) : (
              pastContests.length > 0 ? (
                pastContests.map(contest => (
                  <ContestCard
                    key={contest.id}
                    contest={contest}
                    user={user}
                    isPast={true}
                  />
                ))
              ) : (
                <p className="no-contests">No past contests</p>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home