import React, { SetStateAction, useEffect, useRef, useState} from "react";
import { io, Socket } from 'socket.io-client';

//Connect to server socket
const user_socket: Socket = io("http://192.145.146.90:18223/", {
    withCredentials: true,
    transports: ['websocket']
});

interface ClientConnectProps {
    content: string;
    setContent: React.Dispatch<React.SetStateAction<string>>;
    saved_note_id: number;
};

const ClientConnect = ({ content, setContent, saved_note_id }: ClientConnectProps) => {
    const [isConnected, setIsConnected] = useState(false);
    const [note_content, set_note_data] = useState('');
    const ignoreUpdate = useRef(false);

    useEffect(() => {
        //After establishing connection
        const logConnect = () => {
            console.log('Connection successful:', user_socket.id);
            setIsConnected(true);
        };

        //Log note update
        const logNoteUpdate = (note_stuff: string) => {
            console.log("Note update received");
            ignoreUpdate.current = true;
            setContent(note_stuff);
            // set_note_data(note_stuff);
        };

        //After disconnection
        const logDisconnect = () => {
            console.log('Disconnected from server:', user_socket.id);
            setIsConnected(false);
        };

        //Listen for server events
        user_socket.on('connect', logConnect);
        user_socket.on('note_content', logNoteUpdate);
        user_socket.on('disconnect', logDisconnect);

        //Disconnection cleanup
        return () => {
            user_socket.off('connection');
            user_socket.off('note-update');
            user_socket.off('disconnect');
        };
    }, []);

    //Handle connection to room(note)
    useEffect(() => {
        user_socket.emit('note-open', saved_note_id);
    }, [saved_note_id])

    //Handle broadcasting to server
    useEffect(() => {
        if (ignoreUpdate.current === false){
            user_socket.emit('note-update', content);
        } else {
            ignoreUpdate.current = false;
        }
    }, [content]);

    //Send changes to note to server
    const noteUpdateProtocol = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const updatedContent = e.target.value;
        set_note_data(updatedContent);
        console.log("Sending note update to server");
        //Send updated content to the server
        if (ignoreUpdate.current === false){
            user_socket.emit('note-update', updatedContent);
        } else {
            ignoreUpdate.current = false;
        }
    };

    return (
        <></>
    );
};

export default ClientConnect;
