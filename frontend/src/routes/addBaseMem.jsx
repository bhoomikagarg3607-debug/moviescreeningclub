import { useState } from 'react';
import { api } from '@/utils/api';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2'

const AddBaseMem = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleAssignMembership = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await ('/membership/assign-base-membership');
      setSuccess('Base membership assigned successfully to all core team users.');
    } catch (err) {
      setError('Error assigning base membership.');
    }
    setLoading(false);
  };

  return (
    <div className="p-4 text-center">
      <h2 className="text-2xl font-bold">Assign Base Membership</h2>
      <button

        onClick={() => {
          Swal.fire({
              title: 'Confirm',
              text: `Are you sure you want to assign base membership to all core team members?`,
              icon: 'info',
              confirmButtonText: 'Yes',
              showCancelButton: true
            }).then((result) => {
              if (result.isConfirmed) {
                handleAssignMembership();
              }
            })
        }}
        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        disabled={loading}
      >
        {loading ? 'Assigning...' : 'Assign to Core Team'}
      </button>
      {error && <p className="text-red-500 mt-2">{error}</p>}
      {success && <p className="text-green-500 mt-2">{success}</p>}
    </div>
  );
};

export default AddBaseMem;
