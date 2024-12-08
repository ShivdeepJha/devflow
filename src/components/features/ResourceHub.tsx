import { useState, useEffect } from 'react'
import { PlusIcon, TrashIcon, StarIcon, ArrowTopRightOnSquareIcon,MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'
import { getFromStorage, setInStorage } from '../../utils/storage'

interface Resource {
  id: string
  title: string
  description: string
  url: string
  favorite: boolean
  createdAt: number
}

export default function ResourceHub() {
  const [resources, setResources] = useState<Resource[]>([])
  const [showForm, setShowForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newResource, setNewResource] = useState<Partial<Resource>>({
    title: '',
    description: '',
    url: '',
    favorite: false
  })

  useEffect(() => {
    // Load resources from storage
    const loadResources = async () => {
      const storedResources = await getFromStorage('resources')
      if (storedResources) {
        setResources(storedResources)
      }
    }
    loadResources()
  }, [])

  const saveResources = async (updatedResources: Resource[]) => {
    try {
      await setInStorage('resources', updatedResources)
      setResources(updatedResources)
    } catch (error) {
      console.error('Error saving resources:', error)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const resource: Resource = {
      ...newResource as Resource,
      id: Date.now().toString(),
      createdAt: Date.now()
    }
    saveResources([...resources, resource])
    setShowForm(false)
    setNewResource({
      title: '',
      description: '',
      url: '',
      favorite: false
    })
  }

  const handleDelete = (id: string) => {
    saveResources(resources.filter(r => r.id !== id))
  }

  const toggleFavorite = (id: string) => {
    const updatedResources = resources.map(resource =>
      resource.id === id ? { ...resource, favorite: !resource.favorite } : resource
    )
    saveResources(updatedResources)
  }

  const openResource = (url: string) => {
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url })
    } else {
      window.open(url, '_blank')
    }
  }

  const filteredResources = resources
    .filter(resource =>
      resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      // Sort by favorite status first, then by creation date
      if (a.favorite === b.favorite) {
        return b.createdAt - a.createdAt
      }
      return a.favorite ? -1 : 1
    })

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search resources..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <PlusIcon className="w-5 h-5" />
          Add Resource
        </button>
      </div>

      {/* Resource Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="mb-4 p-4 bg-white rounded-lg shadow">
          <input
            type="text"
            placeholder="Title"
            className="w-full px-4 py-2 mb-2 border rounded"
            value={newResource.title}
            onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
            required
          />
          <textarea
            placeholder="Description"
            className="w-full px-4 py-2 mb-2 border rounded"
            value={newResource.description}
            onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
          />
          <input
            type="url"
            placeholder="URL"
            className="w-full px-4 py-2 mb-2 border rounded"
            value={newResource.url}
            onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
            required
          />
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

      {/* Resources List */}
      <div className="flex-1 overflow-y-auto">
        {filteredResources.map(resource => (
          <div key={resource.id} className="mb-4 card">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{resource.title}</h3>
                  <button
                    onClick={() => toggleFavorite(resource.id)}
                    className={resource.favorite ? 'text-yellow-400' : 'text-gray-400 hover:text-yellow-400'}
                  >
                    {resource.favorite ? (
                      <StarIconSolid className="w-5 h-5" />
                    ) : (
                      <StarIcon className="w-5 h-5" />
                    )}
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{resource.description}</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => openResource(resource.url)}
                    className="text-blue-500 hover:text-blue-700 flex items-center gap-1"
                  >
                    Visit Resource
                    <ArrowTopRightOnSquareIcon className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(resource.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
