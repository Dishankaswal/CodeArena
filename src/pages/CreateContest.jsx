import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './CreateContest.css'

function CreateContest({ user }) {
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    type: 'weekly',
    description: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.title || !formData.date || !formData.time) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      const startDateTime = new Date(`${formData.date}T${formData.time}`)

      const gradients = [
        'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        'linear-gradient(135deg, #0f766e 0%, #14b8a6 100%)',
        'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
        'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
        'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)'
      ]

      const { data, error: insertError } = await supabase
        .from('contests')
        .insert({
          title: formData.title,
          start_time: startDateTime.toISOString(),
          type: formData.type,
          description: formData.description,
          gradient: gradients[Math.floor(Math.random() * gradients.length)],
          created_by: user.id,
          created_by_email: user.email
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Redirect to add questions page
      navigate(`/contest/${data.id}/add-questions`)
    } catch (error) {
      console.error('Error creating contest:', error)
      setError(error.message || 'Failed to create contest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="create-contest-page">
      <div className="create-contest-container">
        <div className="create-header">
          <div className="create-icon">✨</div>
          <h2>Create New Contest</h2>
          <p>Set up a new coding contest for the community</p>
        </div>

        <form onSubmit={handleSubmit} className="create-form">
          {error && <div className="error-message">{error}</div>}
          
          <div className="form-group">
            <label>Contest Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Weekly Contest 476"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date *</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            <div className="form-group">
              <label>Time *</label>
              <input
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Contest Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
            >
              <option value="weekly">Weekly</option>
              <option value="biweekly">Biweekly</option>
              <option value="monthly">Monthly</option>
              <option value="special">Special Event</option>
            </select>
          </div>

          <div className="form-group">
            <label>Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add any additional details about the contest..."
              rows="4"
            />
          </div>

          <button type="submit" className="btn-create" disabled={loading}>
            {loading ? 'Creating Contest...' : 'Create Contest'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default CreateContest
