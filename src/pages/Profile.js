import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import Header from '../components/Header';

const Profile = () => {
  const navigate = useNavigate();
  const { userProfile, signOut, updateProfile, updatePassword } = useAuth();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  
  const [profileData, setProfileData] = useState({
    firstname: '',
    lastname: '',
    age: '',
    gender: '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (userProfile) {
      setProfileData({
        firstname: userProfile.firstname || '',
        lastname: userProfile.lastname || '',
        age: userProfile.age || '',
        gender: userProfile.gender || '',
      });
    }
  }, [userProfile]);

  const handleProfileChange = (e) => {
    setProfileData({ ...profileData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    
    const hasChanges = 
      profileData.firstname !== userProfile?.firstname ||
      profileData.lastname !== userProfile?.lastname ||
      profileData.age !== userProfile?.age ||
      profileData.gender !== userProfile?.gender;
    
    if (!hasChanges) {
      Swal.fire({
        icon: 'info',
        title: 'No Changes',
        text: 'Nothing was modified',
        confirmButtonColor: '#043915',
      });
      return;
    }

    setLoading(true);
    const { error } = await updateProfile(profileData);
    setLoading(false);
    
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message,
        confirmButtonColor: '#043915',
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Profile updated successfully!',
        confirmButtonColor: '#043915',
      });
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Passwords do not match',
        confirmButtonColor: '#043915',
      });
      return;
    }

    if (passwordData.newPassword.length < 6) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Password must be at least 6 characters',
        confirmButtonColor: '#043915',
      });
      return;
    }

    if (!passwordData.currentPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please enter your current password',
        confirmButtonColor: '#043915',
      });
      return;
    }

    setLoading(true);
    const { error } = await updatePassword(passwordData.currentPassword, passwordData.newPassword);
    setLoading(false);
    
    if (error) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: error.message,
        confirmButtonColor: '#043915',
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Password updated successfully!',
        confirmButtonColor: '#043915',
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    }
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Please select an image file',
        confirmButtonColor: '#043915',
      });
      return;
    }

    if (file.size > 2040 * 1024) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Image must be less than 2MB',
        confirmButtonColor: '#043915',
      });
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        try {
          const img = new Image();
          img.onload = async () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            const size = 200;
            canvas.width = size;
            canvas.height = size;
            
            const sourceSize = Math.min(img.width, img.height);
            const sx = (img.width - sourceSize) / 2;
            const sy = (img.height - sourceSize) / 2;
            
            ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
            
            const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
            setImagePreview(compressedBase64);
          };
          img.onerror = () => {
            Swal.fire({
              icon: 'error',
              title: 'Error',
              text: 'Invalid image file',
              confirmButtonColor: '#043915',
            });
          };
          img.src = reader.result;
        } catch (error) {
          console.error('Compression error:', error);
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Failed to process image',
            confirmButtonColor: '#043915',
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Upload error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to upload image',
        confirmButtonColor: '#043915',
      });
    }
  };

  const handleImageConfirm = async () => {
    if (!imagePreview) return;

    setLoading(true);
    const { error } = await updateProfile({ image: imagePreview });
    setLoading(false);

    if (error) {
      console.error('Upload error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Upload Failed',
        text: 'Failed to upload image',
        confirmButtonColor: '#043915',
      });
    } else {
      Swal.fire({
        icon: 'success',
        title: 'Success',
        text: 'Profile photo updated!',
        confirmButtonColor: '#043915',
      });
      setImagePreview(null);
    }
  };

  const handleImageCancel = () => {
    setImagePreview(null);
    fileInputRef.current.value = '';
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <Layout>
      <Header title="Profile" showProfile={false} showBack={true} />
      
      <div className="px-4 py-4 pb-32 md:pb-12">
        {/* Desktop Title */}
        <h1 className="hidden md:block text-[14px] font-medium font-[Poppins] text-dark mb-6">Account Settings</h1>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="md:col-span-4 lg:col-span-3">
            <div className="bg-white rounded-xl md:shadow-sm md:border md:border-gray-100 p-6 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary overflow-hidden flex items-center justify-center">
                  {userProfile?.image ? (
                    <img 
                      src={userProfile.image} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-3xl font-medium font-[Poppins]">
                      {userProfile?.firstname?.charAt(0) || 'U'}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
              </div>
              
              <h2 className="text-[14px] font-medium font-[Poppins] text-dark mb-1">
                {userProfile?.firstname} {userProfile?.lastname}
              </h2>
              <p className="text-[11px] font-[Roboto] text-gray-500 mb-6">{userProfile?.email}</p>

              <button
                onClick={handleLogout}
                className="w-full py-2.5 rounded-lg bg-red-50 text-red-500 text-[11px] font-medium font-[Roboto] hover:bg-red-100 transition-colors border border-red-100"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Right Column: Edit Forms */}
          <div className="md:col-span-8 lg:col-span-9">
            <div className="bg-white rounded-xl md:shadow-sm md:border md:border-gray-100 md:p-6">
              
              {/* Image Preview Area */}
              {imagePreview && (
                <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200 flex items-center gap-4">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                  <div className="flex-1">
                    <p className="text-[11px] font-[Roboto] text-blue-800 mb-2">New profile photo selected</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleImageConfirm}
                        disabled={loading}
                        className="px-3 py-1.5 bg-primary text-white rounded-md text-[10px] font-medium font-[Roboto] hover:bg-primary/90"
                      >
                        {loading ? 'Uploading...' : 'Save Photo'}
                      </button>
                      <button
                        onClick={handleImageCancel}
                        className="px-3 py-1.5 bg-white text-gray-600 border border-gray-200 rounded-md text-[10px] font-medium font-[Roboto] hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex border-b border-gray-100 mb-6">
                <button
                  onClick={() => setActiveTab('profile')}
                  className={`pb-3 px-4 text-[11px] font-medium font-[Poppins] transition-all relative ${
                    activeTab === 'profile' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Edit Profile
                  {activeTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                </button>
                <button
                  onClick={() => setActiveTab('password')}
                  className={`pb-3 px-4 text-[11px] font-medium font-[Poppins] transition-all relative ${
                    activeTab === 'password' ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Change Password
                  {activeTab === 'password' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full"></div>}
                </button>
              </div>

              {/* Form Content */}
              <div className="min-h-[300px]">
                {activeTab === 'profile' ? (
                  <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-[Roboto] text-gray-600 mb-1.5">First Name</label>
                        <input
                          type="text"
                          name="firstname"
                          value={profileData.firstname}
                          onChange={handleProfileChange}
                          className="input-field text-[11px] font-[Roboto]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-[Roboto] text-gray-600 mb-1.5">Last Name</label>
                        <input
                          type="text"
                          name="lastname"
                          value={profileData.lastname}
                          onChange={handleProfileChange}
                          className="input-field text-[11px] font-[Roboto]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[11px] font-[Roboto] text-gray-600 mb-1.5">Age</label>
                        <input
                          type="number"
                          name="age"
                          value={profileData.age}
                          onChange={handleProfileChange}
                          className="input-field text-[11px] font-[Roboto]"
                          placeholder="Enter age"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-[Roboto] text-gray-600 mb-1.5">Gender</label>
                        <select
                          name="gender"
                          value={profileData.gender}
                          onChange={handleProfileChange}
                          className="input-field text-[11px] font-[Roboto]"
                        >
                          <option value="">Select gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full md:w-auto md:px-8 py-2.5 text-[11px] font-[Roboto]"
                      >
                        {loading ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                    <div>
                      <label className="block text-[11px] font-[Roboto] text-gray-600 mb-1.5">Current Password</label>
                      <input
                        type="password"
                        name="currentPassword"
                        value={passwordData.currentPassword}
                        onChange={handlePasswordChange}
                        className="input-field text-[11px] font-[Roboto]"
                        placeholder="Enter current password"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-[Roboto] text-gray-600 mb-1.5">New Password</label>
                      <input
                        type="password"
                        name="newPassword"
                        value={passwordData.newPassword}
                        onChange={handlePasswordChange}
                        className="input-field text-[11px] font-[Roboto]"
                        placeholder="Enter new password"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-[Roboto] text-gray-600 mb-1.5">Confirm New Password</label>
                      <input
                        type="password"
                        name="confirmPassword"
                        value={passwordData.confirmPassword}
                        onChange={handlePasswordChange}
                        className="input-field text-[11px] font-[Roboto]"
                        placeholder="Confirm new password"
                      />
                    </div>

                    <div className="pt-4">
                      <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full md:w-auto md:px-8 py-2.5 text-[11px] font-[Roboto]"
                      >
                        {loading ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Profile;