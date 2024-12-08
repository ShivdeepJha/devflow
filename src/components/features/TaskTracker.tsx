import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import { getFromStorage, setInStorage } from '../../utils/storage'
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd'

interface Task {
  id: string
  title: string
  description: string
  priority: 'Low' | 'Medium' | 'High'
  deadline: string
  status: 'todo' | 'in-progress' | 'completed'
  createdAt: number
  order?: number
}

const COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'completed', title: 'Completed' }
] as const

const PRIORITIES = ['Low', 'Medium', 'High'] as const

export default function TaskTracker() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [showForm, setShowForm] = useState(false)
  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: '',
    description: '',
    priority: 'Medium',
    deadline: '',
    status: 'todo'
  })

  useEffect(() => {
    // Load tasks from storage
    const loadTasks = async () => {
      const storedTasks = await getFromStorage('tasks')
      if (storedTasks) {
        setTasks(storedTasks)
      }
    }
    loadTasks()
  }, [])

  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await setInStorage('tasks', updatedTasks)
      setTasks(updatedTasks)
    } catch (error) {
      console.error('Error saving tasks:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const task: Task = {
      ...newTask as Task,
      id: Date.now().toString(),
      createdAt: Date.now(),
      order: tasks.length
    }
    saveTasks([...tasks, task])
    setShowForm(false)
    setNewTask({
      title: '',
      description: '',
      priority: 'Medium',
      deadline: '',
      status: 'todo'
    })
  }

  const handleDelete = (id: string) => {
    saveTasks(tasks.filter(t => t.id !== id))
  }

  const handleDragEnd = (result: DropResult) => {
    const { source, destination } = result

    // Dropped outside a valid droppable or in same position
    if (!destination || (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )) return

    const updatedTasks = Array.from(tasks)
    const sourceStatus = source.droppableId as Task['status']
    const destStatus = destination.droppableId as Task['status']

    // Find the task being moved
    const taskToMove = updatedTasks.find(t =>
      t.status === sourceStatus &&
      t.order === source.index
    )

    if (!taskToMove) return

    // Update task's status and order
    taskToMove.status = destStatus
    taskToMove.order = destination.index

    // Update orders of other affected tasks
    updatedTasks.forEach(task => {
      if (task.id === taskToMove.id) return // Skip the moved task

      if (sourceStatus === destStatus) {
        // Moving within the same column
        if (task.status === sourceStatus) {
          if (source.index < destination.index) {
            // Moving down
            if (task.order! > source.index && task.order! <= destination.index) {
              task.order! -= 1
            }
          } else {
            // Moving up
            if (task.order! >= destination.index && task.order! < source.index) {
              task.order! += 1
            }
          }
        }
      } else {
        // Moving between columns
        if (task.status === sourceStatus && task.order! > source.index) {
          // Update source column orders
          task.order! -= 1
        }
        if (task.status === destStatus && task.order! >= destination.index) {
          // Update destination column orders
          task.order! += 1
        }
      }
    })

    saveTasks(updatedTasks)
  }

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return 'bg-red-100 text-red-800'
      case 'Medium': return 'bg-yellow-100 text-yellow-800'
      case 'Low': return 'bg-green-100 text-green-800'
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Task Board</h2>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {/* Task Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="card mb-4 p-4">
          <input
            type="text"
            placeholder="Task Title"
            className="w-full px-4 py-2 mb-2 border rounded"
            value={newTask.title}
            onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            className="w-full px-4 py-2 mb-2 border rounded"
            value={newTask.description}
            onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <select
              className="px-4 py-2 border rounded"
              value={newTask.priority}
              onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}
            >
              {PRIORITIES.map(priority => (
                <option key={priority} value={priority}>{priority}</option>
              ))}
            </select>
            <input
              type="date"
              className="px-4 py-2 border rounded"
              value={newTask.deadline}
              onChange={(e) => setNewTask({ ...newTask, deadline: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-gray-600 border rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Save
            </button>
          </div>
        </form>
      )}

      {/* Kanban Board */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
          {COLUMNS.map(column => (
            <div
              key={column.id}
              className="flex flex-col bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
            >
              <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">{column.title}</h3>
              <Droppable droppableId={column.id}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="flex-1 overflow-y-auto"
                  >
                    {tasks
                      .filter(task => task.status === column.id)
                      .sort((a, b) => (a.order || 0) - (b.order || 0))
                      .map((task, index) => (
                        <Draggable
                          key={task.id}
                          draggableId={task.id}
                          index={index}
                        >
                          {(provided) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="card mb-2 dark:bg-gray-900"
                            >
                              <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                                <button
                                  onClick={() => handleDelete(task.id)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <TrashIcon className="w-5 h-5" />
                                </button>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{task.description}</p>
                              <div className="flex justify-between items-center text-sm">
                                <span className={`px-2 py-1 rounded ${getPriorityColor(task.priority)}`}>
                                  {task.priority}
                                </span>
                                {task.deadline && (
                                  <span className="text-gray-500">
                                    Due: {new Date(task.deadline).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          ))}
        </div>
      </DragDropContext>
    </div>
  )
}
