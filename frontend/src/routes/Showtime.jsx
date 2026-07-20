import { AddIcons, DeleteIcons, TickIcons } from '@/components/icons/Show'
import { useLogin } from '@/components/LoginContext'
import MovieCard from '@/components/MovieCard'
import { api } from '@/utils/api'
import { isAllowedLvl } from '@/utils/levelCheck'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const Showtime = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user } = useLogin()
  const [movie, setMovie] = useState({ showtimes: [], poster: '', trailer: '' })
  const [newShowtime, setNewShowtime] = useState({ date: '', time: '' })
  const [showAddRow, setShowAddRow] = useState(false)
  const movieId = new URLSearchParams(location.search).get('movieId')
  const isLocalAdmin = isAllowedLvl(
    'movievolunteer',
    user?.usertype || 'standard'
  )
  const fetchMovie = async () => {
    try {
      const res = await api.get(`/movie/${movieId}`)
      if (!res.data) {
        navigate('/')
      }
      setMovie(res.data)
    } catch (e) {
      console.error('Error fetching showtimes:', e)
    }
  }
  useEffect(() => {
    if (movieId) {
      fetchMovie()
    }
  }, [location.search, navigate])

  const handleSaveShowtime = async () => {
    if (!newShowtime.date || !newShowtime.time) {
      console.error('Date and time must be filled')
      return
    }
    try {
      await (`/movie/${movieId}/showtimes`, {
        date: new Date(newShowtime.date + 'T' + newShowtime.time).toISOString()
      })
      await fetchMovie()
      setNewShowtime({ date: '', time: '' })
      setShowAddRow(false)
    } catch (error) {
      console.error('Error adding showtime:', error)
    }
  }

  const handleDeleteShowtime = async (showtimeId) => {
    api
      .delete(`/movie/${movieId}/${showtimeId}`)
      .then(() => {
        fetchMovie()
      })
      .catch((error) => {
        console.error('Error deleting showtime:', error)
      })
    await fetchMovie()
  }

  const handleChange = (e, field) => {
    setNewShowtime({ ...newShowtime, [field]: e.target.value })
  }
  if (!movie || !user) {
    return <div>Loading...</div>
  }
  return (
    <div className="flex w-full items-center flex-col gap-2 p-4 sm:p-8">
      <div className="flex max-md:flex-col-reverse max-md:items-center bg-white dark:bg-[#141414] w-full md:w-[80vw] lg:w-[60vw] gap-4 sm:gap-8 p-4 sm:p-6 rounded-lg  justify-around ">
        <div className="w-full sm:w-1/2 md:w-1/4">
          <MovieCard movie={movie} />
        </div>
        <div className="flex flex-col gap-3 items-center">
          <p className=" text-center text-2xl font-bold flex items-center gap-2">
            Showtimes{' '}
            {isLocalAdmin && (
              <span
                className="w-6 h-6 cursor-pointer"
                onClick={() => setShowAddRow(!showAddRow)}
              >
                <AddIcons />
              </span>
            )}
          </p>
          <table className="flex flex-col gap-3">
            <thead>
              <tr className="w-full text-lg">
                <th className="w-[24vw] sm:w-44 text-center">Date</th>
                <th className="w-[24vw] sm:w-40 text-center">Time</th>
                {isLocalAdmin && <th className=" text-center"></th>}
              </tr>
            </thead>

            <tbody className="flex flex-col gap-2 ">
              {movie.showtimes.map((showtime, index) => (
                <tr key={index} className="w-full text-medium">
                  <td className="w-[24vw] sm:w-44 text-center">
                    {new Date(showtime.date).toLocaleDateString('en-IN')}
                  </td>
                  <td className="w-[24vw] sm:w-40 text-center">
                    {new Date(showtime.date).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  {isLocalAdmin && (
                    <td
                      onClick={() => handleDeleteShowtime(showtime._id)}
                      className="w-6 h-6 text-center cursor-pointer"
                    >
                      <DeleteIcons />
                    </td>
                  )}
                </tr>
              ))}
              {showAddRow && isLocalAdmin && (
                <tr className="max-sm:flex-col max-sm:flex max-sm:gap-2 w-full text-medium">
                  <td className="w-[24vw] sm:w-44 text-center">
                    <input
                      type="date"
                      className="w-fit rounded-xl bg-[#0c0c0c]/15 py-2 px-2"
                      value={newShowtime.date}
                      onChange={(e) => handleChange(e, 'date')}
                    />
                  </td>
                  <td className="w-[24vw] sm:w-40 text-center">
                    <input
                      className="w-fit rounded-xl bg-[#0c0c0c]/15 py-2 px-2"
                      type="time"
                      value={newShowtime.time}
                      onChange={(e) => handleChange(e, 'time')}
                    />
                  </td>
                  <td className="cursor-pointer" onClick={handleSaveShowtime}>
                    <TickIcons />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}


export default Showtime
