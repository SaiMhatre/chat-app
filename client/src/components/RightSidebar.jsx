import React from 'react'
import assets, { imagesDummyData } from '../assets/assets'
import { chatContext } from '../../context/chatContext';
import { useContext, useEffect, useState, useRef } from 'react'
import { AuthContext } from '../../context/AuthContext.jsx';

const RightSidebar = () => {
  const { selectedUser , messages } = useContext(chatContext);
  const {logout, onlineUsers} = useContext(AuthContext);
  const [msgImages, setMsgImages] = useState([]);

  // Get all the images for the messages and set them to state
  useEffect(() => {
    setMsgImages(messages.filter(msg => msg.image).map(msg => msg.image));
  }, [messages]);

  const [columns, setColumns] = useState(2);
  const containerRef = useRef(null);

  // Adjust number of columns based on container width
  useEffect(() => {
    const updateColumns = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        if (width >= 768) setColumns(2);
        else if (width >= 640) setColumns(1)
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  // Distribute images across columns
  const distributeImages = () => {
    const columnArrays = Array.from({ length: columns }, () => []);
    
    msgImages.forEach((url, index) => {
      const columnIndex = index % columns;
      columnArrays[columnIndex].push({ url, index });
    });
    
    return columnArrays;
  };

  const imageColumns = distributeImages();

  return (
    selectedUser && (<div className={`bg-[#8185B2]/10 text-white w-full relative overflow-y-scroll ${selectedUser ? "max-md:hidden" : ""}`}>
      <div className='pt-16 flex flex-col items-center gap-2 text-xs font-light mx-auto'>
        <img src={selectedUser?.profilePicture || assets.avatar_icon} alt="" 
        className='w-20 aspect-[1/1] rounded-full object-cover'/>
        <h1 className='px-10 text-xl font-medium mx-auto flex items-center gap-2'>
          {onlineUsers.includes(selectedUser?._id) && <p className='w-2 h-2 rounded-full bg-green-500'></p>}
          {selectedUser?.fullName}
        </h1>
        <p className='px-10 mx-auto'>{selectedUser?.bio}</p>
      </div>

      <hr className='border-[#ffffff50]/30 my-4' />

      <div className="px-5 text-xs">
      <p className="text-white font-medium mb-2">Media</p>
      <div 
        ref={containerRef}
        className={`mt-2 overflow-y-scroll grid gap-4 [max-height:calc(100vh-350px)] ${
          columns === 1 ? 'grid-cols-1' : 
          columns === 2 ? 'grid-cols-2' : 
          'grid-cols-3'
        }`}
      >
        {imageColumns.map((column, columnIndex) => (
          <div key={columnIndex} className="flex flex-col gap-4">
            {column.map(({ url, index }) => (
              <div
                key={index}
                onClick={() => window.open(url)}
                className="cursor-pointer rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 transform hover:scale-[1.02] bg-white"
              >
                <img
                  src={url}
                  alt={`media-${index}`}
                  className="w-full h-auto rounded-lg object-cover"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>

      <button onClick={() => logout()} className='absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-400 to-violet-500 
      text-white border-none text-sm font-light px-20 py-2 rounded-full cursor-pointer'>
        Logout
      </button>
    </div>
    )
  )
}

export default RightSidebar;
