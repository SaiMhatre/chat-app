import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import assets from '../assets/assets';
import { AuthContext } from '../../context/AuthContext.jsx';
import { useContext, useRef } from 'react';

const ProfilePage = () => {
  
  const {authUser, updateProfile} = useContext(AuthContext);

  const [loading, setLoading] = useState(false);
  const [selectedImg, setSelectedImg] = useState(null);
  const navigate = useNavigate();
  const [name, setName] = useState(authUser?.fullName);
  const [bio, setBio] = useState(authUser?.bio);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    if(!selectedImg) {
      await updateProfile({fullName: name, bio}); 
      setLoading(false);
      navigate('/');
      return;
    }

    const render = new FileReader();
    render.readAsDataURL(selectedImg);
    render.onload = async () => {
      const base64Image = render.result;
      await updateProfile({fullName: name, profilePicture: base64Image, bio});
      setLoading(false);
      navigate('/');
    }
  }

  return (
    <div className='min-h-screen bg-cover bg-no-repeat flex items-center justify-center relative'>
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="w-12 h-12 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}
      <div className={`w-5/6 max-w-2xl backdrop-blur-2xl text-gray-300 border-2 border-gray-600 flex items-center justify-between max-sm:flex-col-reverse rounded-lg ${loading ? 'pointer-events-none select-none' : ''}`}>
        <form action="" className='flex flex-col gap-5 p-10 flex-1'>
          <h3 className='text-lg'>Profile details</h3>
          <label htmlFor="avatar" className='flex items-center gap-3 cursor-pointer'>
            <input onChange={(e) => setSelectedImg(e.target.files[0])} type="file" id='avatar' accept='.png, .jpg, .jpeg' hidden/>
            <img src='../../upload-icon.png' alt="avatar" 
            className="w-[18px] h-[18px]"/>
            Upload Profile Image
          </label>
          <input type="text" required placeholder='Your name' value={name} onChange={(e) => setName(e.target.value)}
          className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500'/>
          <textarea required placeholder='Write profile bio' value={bio} onChange={(e) => setBio(e.target.value)}
          className='p-2 border border-gray-500 rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500' rows={4}></textarea>
          <button type='submit' onClick={handleSubmit} className='bg-gradient-to-r from-purple-400 to-violet-600 text-white p-2 rounded-full text-lg cursor-pointer'>Save</button>
        </form>
        <img src={selectedImg ? URL.createObjectURL(selectedImg) : authUser?.profilePicture || assets.logo_icon} alt='' className={`max-w-44 aspect-square rounded-full mx-10 object-cover max-sm:mt-10 
          ${selectedImg && 'rounded-full'}`}/>
      </div>
    </div>
  )
}

export default ProfilePage
