import { useState } from 'react'
import './CodeCompiler.css'

function CodeCompiler({ questionId, language = 'javascript', testCases = [] }) {
  const [code, setCode] = useState(getDefaultCode(language))
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState(language)
  const [stdin, setStdin] = useState('')
  const [showInput, setShowInput] = useState(false)
  const [testResults, setTestResults] = useState([])
  const [showTestCases, setShowTestCases] = useState(testCases.length > 0)

  const languages = [
    { id: 'javascript', name: 'JavaScript', version: '18.15.0' },
    { id: 'python', name: 'Python', version: '3.10.0' },
    { id: 'java', name: 'Java', version: '15.0.2' },
    { id: 'cpp', name: 'C++', version: '10.2.0' },
    { id: 'c', name: 'C', version: '10.2.0' },
    { id: 'go', name: 'Go', version: '1.16.2' },
    { id: 'rust', name: 'Rust', version: '1.68.2' },
    { id: 'typescript', name: 'TypeScript', version: '5.0.3' },
  ]

  function getDefaultCode(lang) {
    const templates = {
      javascript: `// Write your JavaScript code here
function solution() {
  console.log("Hello, World!");
}

solution();`,
      python: `# Write your Python code here
def solution():
    print("Hello, World!")

solution()`,
      java: `// Write your Java code here
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}`,
      cpp: `// Write your C++ code here
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, World!" << endl;
    return 0;
}`,
      c: `// Write your C code here
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}`,
      go: `// Write your Go code here
package main
import "fmt"

func main() {
    fmt.Println("Hello, World!")
}`,
      rust: `// Write your Rust code here
fn main() {
    println!("Hello, World!");
}`,
      typescript: `// Write your TypeScript code here
function solution(): void {
  console.log("Hello, World!");
}

solution();`,
    }
    return templates[lang] || templates.javascript
  }

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang)
    setCode(getDefaultCode(newLang))
    setOutput('')
  }

  const runCode = async () => {
    setIsRunning(true)
    setOutput('Running code...')

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: selectedLanguage,
          version: languages.find(l => l.id === selectedLanguage)?.version || '*',
          files: [
            {
              name: getFileName(selectedLanguage),
              content: code,
            },
          ],
          stdin: stdin,
        }),
      })

      const data = await response.json()

      if (data.run) {
        let result = ''
        
        if (data.run.stdout) {
          result += '📤 Output:\n' + data.run.stdout
        }
        
        if (data.run.stderr) {
          result += (result ? '\n\n' : '') + '⚠️ Errors:\n' + data.run.stderr
        }
        
        if (data.run.code !== 0) {
          result += (result ? '\n\n' : '') + `❌ Exit Code: ${data.run.code}`
        } else {
          result += (result ? '\n\n' : '') + '✅ Exit Code: 0 (Success)'
        }

        if (!data.run.stdout && !data.run.stderr) {
          result = '✅ Code executed successfully with no output'
        }

        setOutput(result)
      } else {
        setOutput('❌ Error: Unable to execute code')
      }
    } catch (error) {
      console.error('Error running code:', error)
      setOutput('❌ Error: Failed to connect to code execution service\n\n' + error.message)
    } finally {
      setIsRunning(false)
    }
  }

  const runTestCases = async () => {
    if (testCases.length === 0) {
      alert('No test cases available for this problem')
      return
    }

    setIsRunning(true)
    setOutput('Running test cases...')
    setTestResults([])

    const results = []

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i]
      
      try {
        const response = await fetch('https://emkc.org/api/v2/piston/execute', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            language: selectedLanguage,
            version: languages.find(l => l.id === selectedLanguage)?.version || '*',
            files: [
              {
                name: getFileName(selectedLanguage),
                content: code,
              },
            ],
            stdin: testCase.input,
          }),
        })

        const data = await response.json()

        if (data.run) {
          const actualOutput = (data.run.stdout || '').trim()
          const expectedOutput = testCase.output.trim()
          const passed = actualOutput === expectedOutput

          results.push({
            testCase: i + 1,
            input: testCase.input,
            expectedOutput: expectedOutput,
            actualOutput: actualOutput,
            passed: passed,
            error: data.run.stderr || null,
          })
        }
      } catch (error) {
        results.push({
          testCase: i + 1,
          input: testCase.input,
          expectedOutput: testCase.output,
          actualOutput: '',
          passed: false,
          error: error.message,
        })
      }
    }

    setTestResults(results)
    
    const passedCount = results.filter(r => r.passed).length
    const totalCount = results.length
    
    let summary = `\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`
    summary += `   TEST RESULTS: ${passedCount}/${totalCount} PASSED\n`
    summary += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`
    
    results.forEach((result, index) => {
      summary += `Test Case ${result.testCase}: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`
      summary += `Input: ${result.input || '(empty)'}\n`
      summary += `Expected: ${result.expectedOutput || '(empty)'}\n`
      summary += `Got: ${result.actualOutput || '(empty)'}\n`
      if (result.error) {
        summary += `Error: ${result.error}\n`
      }
      summary += `\n`
    })

    setOutput(summary)
    setIsRunning(false)
  }

  const submitSolution = () => {
    // TODO: Implement solution submission logic
    alert('Solution submission will be implemented soon!')
  }

  function getFileName(lang) {
    const fileNames = {
      javascript: 'solution.js',
      python: 'solution.py',
      java: 'Main.java',
      cpp: 'solution.cpp',
      c: 'solution.c',
      go: 'solution.go',
      rust: 'solution.rs',
      typescript: 'solution.ts',
    }
    return fileNames[lang] || 'solution.txt'
  }

  return (
    <div className="code-compiler">
      <div className="compiler-header">
        <div className="language-selector">
          <label>Language:</label>
          <select 
            value={selectedLanguage} 
            onChange={(e) => handleLanguageChange(e.target.value)}
            disabled={isRunning}
          >
            {languages.map(lang => (
              <option key={lang.id} value={lang.id}>
                {lang.name} ({lang.version})
              </option>
            ))}
          </select>
        </div>
        
        <button 
          className="btn-toggle-input"
          onClick={() => setShowInput(!showInput)}
        >
          {showInput ? '🔽 Hide Input' : '🔼 Show Input'}
        </button>
      </div>

      {showInput && (
        <div className="stdin-section">
          <label>Standard Input (stdin):</label>
          <textarea
            className="stdin-input"
            value={stdin}
            onChange={(e) => setStdin(e.target.value)}
            placeholder="Enter input for your program (optional)..."
            rows="3"
          />
        </div>
      )}

      <div className="code-editor-wrapper">
        <textarea
          className="code-editor"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Write your code here..."
          spellCheck="false"
          disabled={isRunning}
        />
      </div>

      <div className="compiler-actions">
        <button 
          className="btn-run" 
          onClick={runCode}
          disabled={isRunning}
        >
          {isRunning ? '⏳ Running...' : '▶️ Run Code'}
        </button>
        {testCases.length > 0 && (
          <button 
            className="btn-test" 
            onClick={runTestCases}
            disabled={isRunning}
          >
            {isRunning ? '⏳ Testing...' : '🧪 Run Tests'}
          </button>
        )}
        <button 
          className="btn-submit" 
          onClick={submitSolution}
          disabled={isRunning}
        >
          ✅ Submit Solution
        </button>
      </div>

      {testCases.length > 0 && (
        <div className="test-cases-display">
          <button 
            className="btn-toggle-tests"
            onClick={() => setShowTestCases(!showTestCases)}
          >
            {showTestCases ? '▼' : '▶'} Test Cases ({testCases.length})
          </button>
          
          {showTestCases && (
            <div className="test-cases-list">
              {testCases.map((tc, index) => (
                <div key={index} className="test-case-display-item">
                  <div className="test-case-display-header">
                    <span className="test-case-label">Test Case {index + 1}</span>
                    {testResults[index] && (
                      <span className={`test-result-badge ${testResults[index].passed ? 'passed' : 'failed'}`}>
                        {testResults[index].passed ? '✅ Passed' : '❌ Failed'}
                      </span>
                    )}
                  </div>
                  <div className="test-case-display-content">
                    <div className="test-case-io">
                      <strong>Input:</strong>
                      <pre>{tc.input || '(empty)'}</pre>
                    </div>
                    <div className="test-case-io">
                      <strong>Expected Output:</strong>
                      <pre>{tc.output || '(empty)'}</pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {output && (
        <div className="output-section">
          <h4>Output:</h4>
          <pre className="output-content">{output}</pre>
        </div>
      )}
    </div>
  )
}

export default CodeCompiler
