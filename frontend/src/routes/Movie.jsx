import { Loading } from '@/components/icons/Loading'
import { useLogin } from '@/components/LoginContext'
import { useMembershipContext } from '@/components/MembershipContext'
import MovieCard from '@/components/MovieCard'
import Seats from '@/components/Seats'
import { api } from '@/utils/api'
import { isAllowedLvl } from '@/utils/levelCheck'
import { getUserType } from '@/utils/user'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'

const Movie = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useLogin()
  const { hasMembership, memberships, checkMembershipStatus } =
    useMembershipContext()
  const [seats, setSeats] = useState(null)
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(false)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [showtime, setShowtime] = useState(null)
  const [availableSeats, setAvailableSeats] = useState(0)
  const [freePasses, setFreePasses] = useState(0)
  const [movieFree, setMovieFree] = useState(false)
  const userDesignation = getUserType(user.email)
  const movieId = new URLSearchParams(location.search).get('movieId')

  const fetchSeats = async (showtimeId) => {
    try {
      const res = await api.get(`/seatmap/${showtimeId}`)
      setSeats(res.data)
      const availableseats = res.data.filter((seat) => seat.type !== 'blocked' && !seat.occupied).length
      setAvailableSeats(availableseats)
    } catch (error) {
      setSeats(null)
      console.error('Error fetching seats:', error)
    }
  }
  const fetchFreePasses = async (showtimeId) => {
    try {
      let x
      if (userDesignation === 'btech') {
        x = 1
      } else if (userDesignation === 'mtech/phd') {
        x = 2
      } else {
        x = 4
      }
      const res = await api.get(`/seatmap/freepasses/${showtimeId}`)
      const count1 = res.data.count
      setFreePasses(x - count1)
    } catch (error) {
      console.error('Error fetching free passes:', error)
    }
  }
  const getDateFormatted = (dateS) => {
    const date = new Date(dateS)
    const day = date.getDate()
    const suffix =
      day % 10 === 1 && day !== 11 ? (
        <sup>st</sup>
      ) : day % 10 === 2 && day !== 12 ? (
        <sup>nd</sup>
      ) : day % 10 === 3 && day !== 13 ? (
        <sup>rd</sup>
      ) : (
        <sup>th</sup>
      )

    const month = date.toLocaleString('en-IN', { month: 'short' })
    const time = date.toLocaleString('en-IN', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    })

    return { day, month, time }
  }

  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.get(`/movie/${movieId}`)
        if (res.status !== 200) {
          navigate('/')
        }
        setMovie(res.data)
        if (res.data.showtimes.length) {
          fetchSeats(res.data.showtimes[0]._id)
          fetchFreePasses(res.data.showtimes[0]._id)
          setShowtime(res.data.showtimes[0]._id)
        }
      } catch (error) {
        console.error('Error fetching movie:', error)
        navigate('/')
      }
    })()
  }, [movieId, navigate])

  useEffect(() => {
    if (movie) {
      setMovieFree(movie.free)
    }
  }, [movie])

  const maxAllowed = movieFree
    ? freePasses
    : (() => {
        const activeMembership = memberships?.find(
          (membership) => membership.isValid
        )
        if (!activeMembership) return 0

        // For Film Fest Pass, only allow 1 seat at a time and limited by movie count
        if (activeMembership.memtype === 'filmFest') {
          const moviesUsedCount = activeMembership.moviesUsed?.length || 0
          const canBuyMore = moviesUsedCount < activeMembership.movieCount
          return canBuyMore ? 1 : 0
        }

        return activeMembership.availQR ?? 0
      })()
  const bookSeats = async () => {
    try {
      const activeMembership = memberships?.find(
        (membership) => membership.isValid
      )

      // Film Fest Pass validation (with backward compatibility)
      if (activeMembership?.memtype === 'filmFest') {
        if (selectedSeats.length > 1) {
          Swal.fire({
            title: 'Error',
            text: 'Film Fest Pass: You can only buy 1 ticket at a time',
            icon: 'error'
          })
          return
        }

        // Check if already booked (with safe navigation for backward compatibility)
        const moviesUsed = activeMembership.moviesUsed || []
        const alreadyBooked = moviesUsed.some((movieId) => movieId === showtime)
        if (alreadyBooked) {
          Swal.fire({
            title: 'Error',
            text: 'Film Fest Pass: You have already booked a ticket for this movie',
            icon: 'error'
          })
          return
        }
      }

      setLoading(true)
      const res = await api.put(`/seatmap/${showtime}`, {
        seats: selectedSeats
      })
      if (
        res.status === 200 &&
        res.data.some((seat) => seat.message === 'Seat assigned')
      ) {
        checkMembershipStatus()
        navigate('/tickets')
      } else {
        Swal.fire({
          title: 'Error',
          html: `<p>Error booking seats</p> ${res.data.map((seat) => `<p>${seat.seat}: ${seat.message}</p>`).join('')}`,
          icon: 'error'
        })
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'Error booking seats',
        icon: 'error'
      })
    }
    setLoading(false)
  }
  const mailUsers = async (showtimeId) => {
    try {
      const res = await api.get(`/seatmap/mail/${showtimeId}`)
      if (res.status !== 200) {
        Swal.fire({
          title: 'Error',
          text: 'Error sending mail',
          icon: 'error'
        })
      }
      navigator.clipboard.writeText(res.data.join(', '))
      Swal.fire({
        title: 'Success',
        text: 'Mail ids copied, pls paste in bcc',
        icon: 'success'
      })
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'Error sending mail',
        icon: 'error'
      })
    }
  }
  const BottomBar = () =>
    selectedSeats.length > 0 &&
    (hasMembership || movieFree) && (
      <div className="sticky bottom-0 z-[1200] flex w-full flex-col items-center justify-between gap-2 bg-white dark:bg-[#141414] p-2 drop-shadow-2xl sm:flex-row sm:pr-8">
        {!!selectedSeats.length && (
          <p className="text-xl font-bold">
            Total: {selectedSeats.length || 0}
          </p>
        )}
        <p className="text-xl">
          <span className="font-bold">Seats: </span> {selectedSeats.join(', ')}
        </p>
        <button
          disabled={loading}
          onClick={() => {
            if (loading) return
            if (!selectedSeats.length) {
              Swal.fire({
                title: 'Error',
                text: 'Please select seats to book',
                icon: 'error'
              })
              return
            }
            Swal.fire({
              title: 'Confirm',
              text: `Are you sure you want to book these seat(s) ${selectedSeats.join(', ')} ?`,
              icon: 'info',
              confirmButtonText: 'Yes',
              showCancelButton: true
            }).then((result) => {
              if (result.isConfirmed) {
                bookSeats()
              }
            })
          }}
          className="rounded-md bg-green-600 p-2 text-xl text-white"
        >
          {loading ? 'Booking...' : 'Book'}
        </button>
      </div>
    )

  if (!movie) {
    return <Loading />
  }

  return (
    <div className="flex w-full flex-col items-center relative -mb-10">
      <div className="flex w-full flex-col items-center p-4">
        <div className="flex w-full max-md:flex-col justify-between items-center sm:items-start gap-6 p-4">
          <div className="w-[50vw] sm:w-[30vw] xl:w-[20vw]">
            <MovieCard movie={movie}>
              <p className="text-sm mt-1 overflow-y-auto hide-scroll">
                {movie?.description}
              </p>
            </MovieCard>
          </div>

          <div className="flex max-sm:w-full max-sm:flex-col  justify-between gap-4 sm:gap-6">
            <div className={`flex flex-col ${seats ? 'block' : 'hidden'}`}>
              <div>
                <span className="bg-white-50 font-roboto text-10 mr-2 cursor-pointer border border-green-600 bg-green-600 px-2 text-center"></span>
                <span className="text-md">Selected Seat</span>
              </div>
              <div>
                <span className="seat bg-white-50 font-roboto text-10 mr-2 cursor-pointer border border-red-400 bg-gray-300 px-2 text-center"></span>
                <span className="text-md">Seat Already Booked</span>
              </div>
              <div>
                <span className="seat bg-white-50 font-roboto text-10 mr-2 cursor-pointer border border-gray-400 px-2 text-center"></span>
                <span className="text-md">Seat Not Booked Yet</span>
              </div>
              <p className="mt-2 text-md">
                <span className="font-bold">
                  {movieFree
                    ? 'No. of Free Passes Left: '
                    : memberships?.find((membership) => membership.isValid)
                          ?.memtype === 'filmFest'
                      ? 'Film Fest Pass - Movies Left: '
                      : 'No. of Paid Passes Left: '}
                </span>
                {movieFree
                  ? freePasses
                  : (() => {
                      const activeMembership = memberships?.find(
                        (membership) => membership.isValid
                      )
                      if (activeMembership?.memtype === 'filmFest') {
                        return (
                          activeMembership.movieCount -
                          (activeMembership.moviesUsed?.length || 0)
                        )
                      }
                      return activeMembership?.availQR ?? 0
                    })()}
              </p>
              <p className="mt-2 text-md">
                <span className="font-bold">Number of seats left: </span>
                {availableSeats}
              </p>
            </div>
            <div className="flex flex-col">
              <p className="mb-1 font-bold">Showtimes available</p>
              <div className="grid grid-cols-2  sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 gap-4 ">
                {movie?.showtimes.map((showtimeM) => {
                  const dateFor = getDateFormatted(showtimeM.date)
                  return (
                    <button
                      key={showtimeM._id}
                      onClick={() => {
                        fetchSeats(showtimeM._id)
                        setShowtime(showtimeM._id)
                        setSelectedSeats([])
                      }}
                      className={`flex flex-col items-center justify-center rounded-lg p-2 sm:p-4 text-center text-white hover:bg-green-600 hover:dark:bg-green-800 ${showtimeM._id === showtime ? 'bg-green-700 dark:bg-green-900' : 'bg-green-300 dark:bg-green-500'}`}
                    >
                      <p className="text-lg">{`${dateFor.day} ${dateFor.month}`}</p>
                      <p className="text-md">{dateFor.time}</p>
                    </button>
                  )
                })}
                <div className="hidden bg-green-700 dark:bg-green-900 " />
              </div>
              <div className="hidden bg-green-300 dark:bg-green-500" />
              <div className="flex flex-col gap-2 my-5">
                <button
                  onClick={() => {
                    navigate('/order?showtime=' + showtime)
                  }}
                  className="rounded-md bg-orange-500 p-2 text-white"
                >
                  Order Food
                </button>
                {isAllowedLvl('movievolunteer', user.usertype) && (
                  <>
                    <button
                      onClick={() => {
                        navigate('/showtime?movieId=' + movieId)
                      }}
                      className="rounded-md bg-red-500 p-2 text-white"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        navigate('/food?showtime=' + showtime)
                      }}
                      className="rounded-md bg-red-500 p-2 text-white"
                    >
                      Edit Food
                    </button>
                  </>
                )}
                {isAllowedLvl('admin', user.usertype) && (
                  <button
                    onClick={() => {
                      mailUsers(showtime)
                    }}
                    className="rounded-md bg-blue-500 p-2 text-white"
                  >
                    Mail
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-[#141414] rounded-xl p-2 sm:p-4 flex w-full overflow-auto">
          {seats && (
            <Seats
              seats={seats}
              selectedSeats={selectedSeats}
              setSelectedSeats={setSelectedSeats}
              maxAllowed={maxAllowed}
            />
          )}
        </div>
      </div>
      <BottomBar />
      {!hasMembership && !movieFree && (
        <div className="sticky bottom-0 z-[1200] flex w-full flex-col items-center justify-between gap-2 bg-white dark:bg-[#141414] p-2 drop-shadow-2xl sm:flex-row sm:pr-8">
          <p className="text-xl">
            No membership found. Please buy a membership to book tickets
          </p>
          <Link
            to="/buy"
            className="rounded-md bg-green-600 p-2 text-xl text-white"
          >
            Buy
          </Link>
        </div>
      )}
    </div>
  )
}

export default Movie
