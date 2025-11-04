import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import './AddQuestions.css'

function AddQuestions({ user }) {
  const { contestId } = useParams()
  const [contest, setContest] = useState(null)
  const [questions, setQuestions] = useState([])
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    difficulty: 'medium',
    points: 100
  })
  const [testCases, setTestCases] = useState([{ input: '', output: '' }])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [generatingHtml, setGeneratingHtml] = useState(false)
  const [rawProblemText, setRawProblemText] = useState('')
  const [showAiGenerator, setShowAiGenerator] = useState(false)
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('gemini_api_key') || '')
  const navigate = useNavigate()

  useEffect(() => {
    fetchContest()
    fetchQuestions()
  }, [contestId])

  const fetchContest = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .eq('id', contestId)
        .single()

      if (error) throw error

      if (data.created_by !== user?.id) {
        setError('You do not have permission to add questions to this contest')
        return
      }

      setContest(data)
    } catch (error) {
      console.error('Error fetching contest:', error)
      setError('Failed to load contest')
    }
  }

  const fetchQuestions = async () => {
    try {
      const { data, error } = await supabase
        .from('contest_questions')
        .select('*')
        .eq('contest_id', contestId)
        .order('order_index', { ascending: true })

      if (error) throw error
      setQuestions(data || [])
    } catch (error) {
      console.error('Error fetching questions:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!formData.title || !formData.description) {
      setError('Please fill in all required fields')
      setLoading(false)
      return
    }

    try {
      // Filter out empty test cases
      const validTestCases = testCases.filter(tc => tc.input.trim() || tc.output.trim())

      const { error: insertError } = await supabase
        .from('contest_questions')
        .insert({
          contest_id: contestId,
          title: formData.title,
          description: formData.description,
          difficulty: formData.difficulty,
          points: formData.points,
          order_index: questions.length,
          test_cases: validTestCases.length > 0 ? validTestCases : null
        })

      if (insertError) throw insertError

      setFormData({
        title: '',
        description: '',
        difficulty: 'medium',
        points: 100
      })
      setTestCases([{ input: '', output: '' }])

      await fetchQuestions()
    } catch (error) {
      console.error('Error adding question:', error)
      setError(error.message || 'Failed to add question')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (questionId) => {
    try {
      const { error } = await supabase
        .from('contest_questions')
        .delete()
        .eq('id', questionId)

      if (error) throw error
      await fetchQuestions()
    } catch (error) {
      console.error('Error deleting question:', error)
    }
  }

  const generateHtmlFromText = async () => {
    if (!rawProblemText.trim()) {
      setError('Please enter a problem statement to generate HTML')
      return
    }

    if (!geminiApiKey.trim()) {
      setError('Please enter your Gemini API key')
      return
    }

    setGeneratingHtml(true)
    setError('')

    try {
      // Save API key to localStorage
      localStorage.setItem('gemini_api_key', geminiApiKey)

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are a competitive programming problem formatter. Convert the following problem statement into clean, well-formatted HTML. Use proper HTML tags for structure:
- Use <h3> for main sections like "Problem", "Input", "Output", "Constraints", "Examples"
- Use <p> for paragraphs
- Use <ul> and <li> for lists
- Use <pre> and <code> for code examples and sample inputs/outputs
- Use <strong> for emphasis
- Use <br> for line breaks where needed
- Make it visually clear and easy to read
- Do NOT include <!DOCTYPE>, <html>, <head>, or <body> tags - only the content HTML
- Use inline styles sparingly, prefer semantic HTML

Problem Statement:
${rawProblemText}

Return ONLY the HTML content, no explanations or markdown.`,
                  },
                ],
              },
            ],
          }),
        }
      )

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error.message || 'Failed to generate HTML')
      }

      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        let htmlContent = data.candidates[0].content.parts[0].text

        // Clean up the response - remove markdown code blocks if present
        htmlContent = htmlContent.replace(/```html\n?/g, '').replace(/```\n?/g, '').trim()

        setFormData({ ...formData, description: htmlContent })
        setShowAiGenerator(false)
        setRawProblemText('')
      } else {
        throw new Error('Invalid response from Gemini API')
      }
    } catch (error) {
      console.error('Error generating HTML:', error)
      setError(error.message || 'Failed to generate HTML. Please check your API key and try again.')
    } finally {
      setGeneratingHtml(false)
    }
  }

  if (!contest) {
    return <div className="add-questions-page"><div className="loading">Loading...</div></div>
  }

  return (
    <div className="add-questions-page">
      <div className="add-questions-container">
        <div className="contest-header">
          <h2>{contest.title}</h2>
          <p>Add questions to your contest</p>
        </div>

        <div className="questions-list">
          <h3>Questions ({questions.length})</h3>
          {questions.length === 0 ? (
            <p className="no-questions">No questions added yet</p>
          ) : (
            <div className="questions-grid">
              {questions.map((q, index) => (
                <div key={q.id} className="question-item">
                  <div className="question-header">
                    <span className="question-number">Q{index + 1}</span>
                    <span className={`difficulty ${q.difficulty}`}>{q.difficulty}</span>
                    <span className="points">{q.points} pts</span>
                  </div>
                  <h4>{q.title}</h4>
                  <p>{q.description.substring(0, 100)}...</p>
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="btn-delete"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="add-question-form">
          <h3>Add New Question</h3>
          {error && <div className="error-message">{error}</div>}

          <div className="form-group">
            <label>Question Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Two Sum"
            />
          </div>

          <div className="form-group">
            <div className="description-header">
              <label>Description *</label>
              <button
                type="button"
                className="btn-ai-generator"
                onClick={() => setShowAiGenerator(!showAiGenerator)}
              >
                {showAiGenerator ? '✕ Close AI Generator' : '✨ AI Generate HTML'}
              </button>
            </div>

            {showAiGenerator && (
              <div className="ai-generator-section">
                <div className="ai-info">
                  <p>🤖 Paste your problem statement below and AI will format it into beautiful HTML!</p>
                </div>

                <div className="form-group">
                  <label>Gemini API Key</label>
                  <input
                    type="password"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="Enter your Gemini API key (saved locally)"
                  />
                  <small className="api-key-hint">
                    Get your free API key from{' '}
                    <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer">
                      Google AI Studio
                    </a>
                  </small>
                </div>

                <div className="form-group">
                  <label>Raw Problem Statement</label>
                  <textarea
                    value={rawProblemText}
                    onChange={(e) => setRawProblemText(e.target.value)}
                    placeholder="Paste your problem statement here (plain text)..."
                    rows="8"
                  />
                </div>

                <button
                  type="button"
                  className="btn-generate-html"
                  onClick={generateHtmlFromText}
                  disabled={generatingHtml}
                >
                  {generatingHtml ? '⏳ Generating HTML...' : '✨ Generate HTML'}
                </button>
              </div>
            )}

            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe the problem (HTML supported)..."
              rows="6"
            />
            <small className="description-hint">
              💡 Tip: You can write HTML directly or use the AI generator above
            </small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Difficulty</label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
              >
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label>Points</label>
              <input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                min="10"
                step="10"
              />
            </div>
          </div>

          <div className="test-cases-section">
            <div className="test-cases-header">
              <label>Test Cases (Optional)</label>
              <button
                type="button"
                className="btn-add-test-case"
                onClick={() => setTestCases([...testCases, { input: '', output: '' }])}
              >
                + Add Test Case
              </button>
            </div>

            {testCases.map((testCase, index) => (
              <div key={index} className="test-case-item">
                <div className="test-case-header">
                  <span className="test-case-number">Test Case {index + 1}</span>
                  {testCases.length > 1 && (
                    <button
                      type="button"
                      className="btn-remove-test-case"
                      onClick={() => setTestCases(testCases.filter((_, i) => i !== index))}
                    >
                      ✕
                    </button>
                  )}
                </div>
                <div className="test-case-fields">
                  <div className="form-group">
                    <label>Input</label>
                    <textarea
                      value={testCase.input}
                      onChange={(e) => {
                        const newTestCases = [...testCases]
                        newTestCases[index].input = e.target.value
                        setTestCases(newTestCases)
                      }}
                      placeholder="Enter input for this test case..."
                      rows="3"
                    />
                  </div>
                  <div className="form-group">
                    <label>Expected Output</label>
                    <textarea
                      value={testCase.output}
                      onChange={(e) => {
                        const newTestCases = [...testCases]
                        newTestCases[index].output = e.target.value
                        setTestCases(newTestCases)
                      }}
                      placeholder="Enter expected output..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-add" disabled={loading}>
              {loading ? 'Adding...' : 'Add Question'}
            </button>
            <button
              type="button"
              className="btn-done"
              onClick={() => navigate('/')}
            >
              Done
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddQuestions
