import { api } from '@/utils/api'
import {
  Button,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow
} from '@nextui-org/react'
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
const allRoles = [
  {
    type: 'admin',
    name: 'Admin'
  },
  {
    type: 'volunteer',
    name: 'Volunteer'
  },
  {
    type: 'movievolunteer',
    name: 'Movie Volunteer'
  },
  {
    type: 'ticketvolunteer',
    name: 'Ticket Volunteer'
  },
  {
    type: 'standard',
    name: 'Standard'
  }
]

const AddDropVolunteer = () => {
  const [users, setUsers] = useState([])
  const [roleFilter, setRoleFilter] = useState(allRoles.map((r) => r.type))
  const [filterValue, setFilterValue] = useState('')
  const navigate = useNavigate()

  const fetchUsers = async () => {
    try {
      const baseUrl =
        (import.meta.env.VITE_environment === 'development'
          ? 'http://localhost:8000'
          : document.location.origin) + '/api'
      const url = new URL(baseUrl + `/user/fetchusers`)
      const response = await api.get(url.toString())
      if (response.status !== 200) {
        throw new Error('Failed to fetch user data')
      }
      const data = response.data
      setUsers(sortUsers(data.users))
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }
  useEffect(() => {
    fetchUsers()
  }, [])

  const sortUsers = (users) => {
    const sortedUsers = users.sort((a, b) => {
      const userTypeOrder = {
        admin: 0,
        volunteer: 1,
        movievolunteer: 2,
        ticketvolunteer: 3,
        standard: 4
      }

      const userTypeA = a.usertype.toLowerCase()
      const userTypeB = b.usertype.toLowerCase()

      // Sort by userType first
      if (userTypeOrder[userTypeA] < userTypeOrder[userTypeB]) return -1
      if (userTypeOrder[userTypeA] > userTypeOrder[userTypeB]) return 1

      // If userType is same, sort alphabetically by name
      if (a.name.toLowerCase() < b.name.toLowerCase()) return -1
      if (a.name.toLowerCase() > b.name.toLowerCase()) return 1
      return 0
    })
    return sortedUsers
  }

  const handleSubmit = async (email, userType) => {
    try {
      const response = await (`/user/updateUserType`, {
        email,
        userType
      })

      if (response.status !== 200) {
        throw new Error('Failed to update user type')
      }
      fetchUsers()
    } catch (error) {
      console.error('Error updating user type:', error)
    }
  }

  const statusColorMap = {
    admin: 'success',
    volunteer: 'primary',
    standard: 'secondary',
    movievolunteer: 'danger',
    ticketvolunteer: 'warning'
  }

  const getKeyValue = (item, key) => {
    switch (key) {
      case 'name':
        return <div className="font-semibold">{item.name}</div>
      case 'email':
        return item.email
      case 'designation':
        return item.designation
      case 'Role':
        return (
          <Chip
            className="capitalize"
            color={statusColorMap[item.usertype]}
            size="sm"
            variant="flat"
          >
            {item.usertype}
          </Chip>
        )
      case 'actions':
        return (
          <div className="relative flex items-center justify-start">
            <Dropdown>
              <DropdownTrigger>
                <Button isIconOnly size="sm" variant="light">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="h-6 w-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 6.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 12.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5ZM12 18.75a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
                    />
                  </svg>
                </Button>
              </DropdownTrigger>
              <DropdownMenu>
                {allRoles.map((r, i) => (
                  <DropdownItem
                    key={i}
                    onClick={() => {
                      handleSubmit(item.email, r.type)
                    }}
                  >
                    <p className="dark:text-white"> {r.name}</p>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        )
      default:
        return item.userType
    }
  }

  const columns = ['name', 'email', 'designation', 'Role', 'actions']

  const topContent = React.useMemo(() => {
    return (
      <div className="flex flex-col gap-4 dark">
        <div className="flex items-end justify-start gap-3">
          <Input
            isClearable
            classNames={{
              base: 'w-full sm:max-w-[44%]',
              inputWrapper: 'border-1'
            }}
            placeholder="Search by name..."
            size="sm"
            startContent={
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-6 w-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>
            }
            value={filterValue}
            variant="bordered"
            onClear={() => setFilterValue('')}
            onValueChange={(value) => setFilterValue(value)}
          />
          <div className="flex gap-3">
            <Dropdown>
              <DropdownTrigger className="hidden sm:flex">
                <Button
                  endContent={
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-6 w-6"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="m19.5 8.25-7.5 7.5-7.5-7.5"
                      />
                    </svg>
                  }
                  size="sm"
                  variant="flat"
                >
                  Role
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                disallowEmptySelection
                aria-label="Table Columns"
                closeOnSelect={false}
                selectedKeys={roleFilter}
                selectionMode="multiple"
                onSelectionChange={(roles) =>
                  setRoleFilter(new Array(...roles))
                }
              >
                {allRoles.map((r) => (
                  <DropdownItem key={r.type} className="capitalize">
                    <p className="dark:text-white"> {r.name}</p>
                  </DropdownItem>
                ))}
              </DropdownMenu>
            </Dropdown>
          </div>
        </div>
      </div>
    )
  })
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(filterValue.toLowerCase()) &&
      roleFilter.indexOf(user.usertype) !== -1
  )

  return (
    <div className="flex min-h-lvh justify-center">
      <Table
        isStriped
        className="my-5 w-4/5 max-sm:w-[95%]"
        aria-label="Controlled table example with dynamic content"
        topContent={topContent}
        topContentPlacement="outside"
      >
        <TableHeader
          className="capitalize"
          columns={columns.map((column) => ({ key: column, label: column }))}
        >
          {(column) => (
            <TableColumn className="capitalize" key={column.key}>
              {column.label}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody items={filteredUsers}>
          {(item) => (
            <TableRow key={item._id}>
              {columns.map((columnKey) => (
                <TableCell key={columnKey}>
                  {getKeyValue(item, columnKey)}
                </TableCell>
              ))}
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default AddDropVolunteer
