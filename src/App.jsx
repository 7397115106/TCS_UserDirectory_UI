import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5260'
const emptyForm = {
  name: '',
  age: '',
  city: '',
  state: '',
  pincode: '',
}

function validateUser(values) {
  const errors = {}
  const age = Number(values.age)

  if (!values.name.trim()) {
    errors.name = 'Name is required.'
  } else if (values.name.trim().length < 2 || values.name.trim().length > 100) {
    errors.name = 'Name must be 2 to 100 characters.'
  }

  if (values.age === '') {
    errors.age = 'Age is required.'
  } else if (!Number.isInteger(age) || age < 0 || age > 120) {
    errors.age = 'Age must be a whole number from 0 to 120.'
  }

  if (!values.city.trim()) {
    errors.city = 'City is required.'
  }

  if (!values.state.trim()) {
    errors.state = 'State is required.'
  }

  if (!values.pincode.trim()) {
    errors.pincode = 'Pincode is required.'
  } else if (values.pincode.trim().length < 4 || values.pincode.trim().length > 10) {
    errors.pincode = 'Pincode must be 4 to 10 characters.'
  }

  return errors
}

function App() {
  const [activeView, setActiveView] = useState('list')
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(false)
  const [listError, setListError] = useState('')
  const [toast, setToast] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [formErrors, setFormErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const sortedUsers = useMemo(
    () => [...users].sort((a, b) => a.name.localeCompare(b.name)),
    [users],
  )

  async function loadUsers() {
    setIsLoading(true)
    setListError('')

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`)
      if (!response.ok) {
        throw new Error('Unable to load users.')
      }

      setUsers(await response.json())
    } catch (error) {
      setListError(error.message || 'Unable to load users.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  useEffect(() => {
    if (!toast) {
      return
    }

    const timer = window.setTimeout(() => setToast(''), 3500)
    return () => window.clearTimeout(timer)
  }, [toast])

  function handleChange(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    setFormErrors((current) => ({ ...current, [name]: '' }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = validateUser(form)
    setFormErrors(errors)
    setSubmitError('')

    if (Object.keys(errors).length > 0) {
      return
    }

    setIsSubmitting(true)
    const payload = {
      name: form.name.trim(),
      age: Number(form.age),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Please check the details and try again.')
      }

      setForm(emptyForm)
      setToast('User created successfully.')
      await loadUsers()
      setActiveView('list')
    } catch (error) {
      setSubmitError(error.message || 'Unable to create user.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">User Directory</p>
          <h1>Manage users</h1>
        </div>
        <nav aria-label="Primary navigation">
          <button
            className={activeView === 'list' ? 'active' : ''}
            type="button"
            onClick={() => setActiveView('list')}
          >
            List
          </button>
          <button
            className={activeView === 'add' ? 'active' : ''}
            type="button"
            onClick={() => setActiveView('add')}
          >
            Add
          </button>
        </nav>
      </header>

      <main>
        {activeView === 'list' ? (
          <section className="panel" aria-labelledby="list-title">
            <div className="panel-heading">
              <div>
                <h2 id="list-title">All users</h2>
                <p>{sortedUsers.length} records found</p>
              </div>
              <button className="secondary" type="button" onClick={loadUsers} disabled={isLoading}>
                {isLoading ? 'Loading...' : 'Refresh'}
              </button>
            </div>

            {listError && <div className="alert error">{listError}</div>}
            {isLoading && <div className="spinner">Loading users...</div>}

            {!isLoading && !listError && sortedUsers.length === 0 && (
              <div className="empty-state">
                <h3>No users yet</h3>
                <p>Add the first user to start the directory.</p>
                <button type="button" onClick={() => setActiveView('add')}>
                  Add user
                </button>
              </div>
            )}

            {!isLoading && sortedUsers.length > 0 && (
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Age</th>
                      <th>City</th>
                      <th>State</th>
                      <th>Pincode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedUsers.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.age}</td>
                        <td>{user.city}</td>
                        <td>{user.state}</td>
                        <td>{user.pincode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ) : (
          <section className="panel form-panel" aria-labelledby="add-title">
            <div className="panel-heading">
              <div>
                <h2 id="add-title">Add user</h2>
                <p>Create a new directory record</p>
              </div>
            </div>

            {submitError && <div className="alert error">{submitError}</div>}

            <form onSubmit={handleSubmit} noValidate>
              <FormField
                label="Name"
                name="name"
                value={form.name}
                error={formErrors.name}
                onChange={handleChange}
                placeholder="Enter full name"
              />
              <FormField
                label="Age"
                name="age"
                type="number"
                value={form.age}
                error={formErrors.age}
                onChange={handleChange}
                min="0"
                max="120"
                placeholder="Enter age"
              />
              <FormField
                label="City"
                name="city"
                value={form.city}
                error={formErrors.city}
                onChange={handleChange}
                placeholder="Enter city"
              />
              <FormField
                label="State"
                name="state"
                value={form.state}
                error={formErrors.state}
                onChange={handleChange}
                placeholder="Enter state"
              />
              <FormField
                label="Pincode"
                name="pincode"
                value={form.pincode}
                error={formErrors.pincode}
                onChange={handleChange}
                placeholder="Enter pincode"
              />

              <div className="actions">
                <button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Save user'}
                </button>
                <button className="secondary" type="button" onClick={() => setActiveView('list')}>
                  Cancel
                </button>
              </div>
            </form>
          </section>
        )}
      </main>

      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

function FormField({ label, name, error, ...inputProps }) {
  return (
    <label className="field" htmlFor={name}>
      <span>{label}</span>
      <input id={name} name={name} aria-invalid={Boolean(error)} {...inputProps} />
      {error && <small>{error}</small>}
    </label>
  )
}

export default App
