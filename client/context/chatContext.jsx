import { createContext, useState, useContext } from "react";
import { AuthContext } from "./AuthContext.jsx";
import { useEffect } from "react";
import { toast } from "react-hot-toast";

export const chatContext = createContext();

export const ChatProvider = ({ children }) => {

    const [messages, setMessages] = useState([]);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [unseenMessages, setUnseenMessages] = useState({});

    const {socket, axios} = useContext(AuthContext);

    // function to get all users for sidebar
    const getUsers = async () => {
        try {
            const response = await axios.get("/api/messages/users");
            if (response.data.success) {
                setUsers(response.data.users);
                setUnseenMessages(response.data.unseenMessages);
            } else {
                console.error("Failed to fetch users:", response.data.message);
            }
        } catch (error) {
            toast.error(error.message);
            console.error("Error fetching users:", error);
        }
    };


    // function to get messages for the selected user
    const getMessages = async (userId) => {
        try {
            const response = await axios.get(`/api/messages/${userId}`);
            if (response.data.success) {
                setMessages(response.data.messages);
            }
        } catch (error) {
            toast.error(error.message);
            console.error("Error fetching messages:", error);
        }
    };

    // function to send message to server
    const sendMessage = async (message) => {
        try {
            const response = await axios.post(`/api/messages/send/${selectedUser._id}`, { message });
            if (response.data.success) {
                setMessages((prevMessages) => [...prevMessages, response.data.newMessage]);
            }
        } catch (error) {
            toast.error(error.message);
            console.error("Error sending message:", error);
        }
    };

    // function to subscribe to messages for selected user
    const subscribeToMessages = () => {
        if(!socket) return;
        socket.on("newMessage", (newMessage) => {
            if(selectedUser && newMessage.senderId === selectedUser._id) {
                newMessage.seen = true;
                setMessages((prevMessages) => [...prevMessages, newMessage]);
                axios.put(`/api/messages/mark/${newMessage._id}`);
            }else{
                setUnseenMessages((prev) => ({
                    ...prev,
                    [newMessage.senderId]: (prev[newMessage.senderId] || 0) + 1
                }));
            }
        });
    };

    // function to unsubscribe from messages
    const unsubscribeFromMessages = () => {
        if(socket) {
            socket.off("newMessage");
        }
    }

    useEffect(() => {
        subscribeToMessages();
        return () => {
            unsubscribeFromMessages();
        };
    }, [socket, selectedUser]);

    const value = {
        // Define any chat-related state or functions here  
        messages,
        getMessages,
        users,
        selectedUser,
        setSelectedUser,
        unseenMessages,
        setUnseenMessages,
        getUsers,
        sendMessage,
    };
  return (
    <chatContext.Provider value={value}>
      {children}
    </chatContext.Provider>
  );
}