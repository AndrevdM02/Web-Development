import { Server, Socket } from "socket.io";

export function setupSocket(server_socket: Server) {
    //connection and data handling for users
    server_socket.on('connection', (c_socket: Socket) => {
        console.log('New user connected:', c_socket.id);
        let current_note: string;

        //receives content from user and broadcasts to everyone
        c_socket.on('note-update', (note_data) => {
            c_socket.to(current_note).emit('note_content', note_data);
            console.log('Received update from:', c_socket.id, 'sending to other users');
        });

        //receives editing feedback from user and broadcasts to others
        c_socket.on('editing', (feedback_data) => {
            c_socket.to(current_note).emit('editing', feedback_data);
            console.log('User:', c_socket.id, 'is editing');
        });

        c_socket.on('note-open', (note_id:string) => {
            if (current_note !== undefined) {
                c_socket.leave(current_note);
            }
            c_socket.join(note_id);
            current_note = note_id;
            console.log('User:', c_socket.id, 'is editing note:', note_id, 'and is in rooms:', c_socket.rooms);
        });

        c_socket.on('disconnect', () => {
            console.log('User disconnected:', c_socket.id);
        });
    });
}
