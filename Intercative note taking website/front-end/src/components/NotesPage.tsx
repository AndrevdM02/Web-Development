import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { useLocation, useNavigate, Navigate } from 'react-router-dom';
// import { Switch } from "@/components/ui/switch";
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { Textarea } from './ui/textarea';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { Toaster } from "@/components/ui/toaster"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import {
  FontBoldIcon,
  FontItalicIcon,
  UnderlineIcon,
} from "@radix-ui/react-icons"
import {
  Card,
  CardContent,
  // CardDescription,
  // CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  getUserById,
  getNotesByOwnerId,
  updateUserInfo,
  updateUserPassword,
  deleteUser,
  createNote,
  deleteNote,
  getCategoryByUserId,
  getNotesForBooks,
  createCategory,
  deleteCategory,
  updateNote,
  updateCategoryName,
  getNoteByName,
  saveNote,
  getCategoryByName,
  moveNote,
  getSharedNotesByUserID,
  getNoteById,
  getCategoryById,
  saveSharedNote,
  createSharedNote,
  getUserByEmail,
  removeSharedNote, 
  checkIfExists,
  createUserImage} from '../../../backend/src/frontEndRequests'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import '../App.css';
import { SearchBar } from './SearchBar';
import DarkModeToggle from '../DarkModeToggle';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { useDarkMode } from "../DarkModeContext";
import remarkGfm from 'remark-gfm';
import { AlertCircle, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import ClientConnect from '../websocket/userSocket';

let userId: number = -1;
let sortDate: boolean = false;
let ascending: boolean = false;
let opened_note: boolean = false;
let saved_note: boolean = false;
let saved_note_id: number = -1;
let note_text: string = "";
let share_tab: boolean = false;
let is_shared_note = false;
const UpdateContext = createContext<{
  update: number;
  setUpdate: React.Dispatch<React.SetStateAction<number>>;
}>({ update: 0, setUpdate: () => {} });

const BackgroundTransition: React.FC<{ isDarkMode: boolean; children: React.ReactNode }> = ({ isDarkMode, children }) => (
  <>
    <div
      className={`
        fixed inset-0
        bg-cover bg-center bg-no-repeat
        transition-opacity duration-500 ease-in-out
        ${isDarkMode ? 'opacity-0' : 'opacity-100'}
      `}
      style={{ backgroundImage: "url('/src/logos/png/light_mode_backdrop.jpg')" }}
    />
    <div
      className={`
        fixed inset-0
        bg-cover bg-center bg-no-repeat
        transition-opacity duration-500 ease-in-out
        ${isDarkMode ? 'opacity-100' : 'opacity-0'}
      `}
      style={{ backgroundImage: "url('/src/logos/png/dark_mode_backdrop.jpg')" }}
    />
    <div className="relative z-10 min-h-screen">
      {children}
    </div>
  </>
);

/**
 * The NotesPage, where the notes can be constructed, viewed and modified.
 * @returns The fully constructed notes page.
 */
export const NotesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  userId = location.state?.userId;

  // Early return with redirect if userId is undefined
  if (userId === undefined) {
    console.log("Redirecting to login page");
    return <Navigate to="/" replace />;
  }

  const [update, setUpdate] = useState(0);
  const { isDarkMode } = useDarkMode();
  return (
<UpdateContext.Provider value={{ update, setUpdate }}>
  <BackgroundTransition isDarkMode={isDarkMode}>
    <div
      className={`fixed inset-0 bg-cover bg-center bg-no-repeat overflow-auto transition-all duration-500 ease-in-out z-0 ${
        isDarkMode
          ? "bg-[url('/src/logos/png/dark_mode_backdrop.jpg')]"
          : "bg-[url('/src/logos/png/light_mode_backdrop.jpg')]"
      }`}
    ></div>
    <div className="relative z-10 flex flex-col min-h-screen">
      <div className="fixed top-0 right-1 z-10">
        <DarkModeToggle />
      </div>
      <div className="flex-grow">
        <Resize />
      </div>
      <Toaster />
    </div>
  </BackgroundTransition>
</UpdateContext.Provider>
  );
};

/**
 * This function creates the typing area.
 *
 * @param param0 An array of strings used to indicate if the bold, italic or/and underline objects are avtive
 * @returns The typing area of the page
 */
export function TypingArea() {
  const [content, setContent] = useState<string>("");
  const [isEditing, setIsEditing] = useState<boolean>(true);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const { isDarkMode } = useDarkMode();
  const { update } = useContext(UpdateContext);
  const { toast } = useToast();

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.ctrlKey || e.metaKey) {
      if (e.key === 'b') {
        e.preventDefault();
        applyFormatting('**');
      } else if (e.key === 'i') {
        e.preventDefault();
        applyFormatting('*');
      } else if (e.key === 'u') {
        e.preventDefault();
        applyFormatting('__');
      }
    }
  }

  const applyFormatting = (format: string) => {
    const textarea = textAreaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);

    if (start === end) {
      // No text selected, insert formatting markers
      const newContent = content.substring(0, start) + format + format + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = start + format.length;
        textarea.selectionEnd = start + format.length;
      }, 0);
    } else {
      // Text selected, wrap it with formatting
      const newContent = content.substring(0, start) + format + selectedText + format + content.substring(end);
      setContent(newContent);
      setTimeout(() => {
        textarea.selectionStart = start;
        textarea.selectionEnd = end + 2 * format.length;
      }, 0);
    }
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const handleOpen = async () => {
    if (opened_note) {
      if (saved_note === true) {
        saved_note = false;
        if (share_tab === false) {
          await saveNote(userId, saved_note_id, content);
        } else {
          await saveSharedNote(saved_note_id, content);
        }
      } else {
        if (note_text === null) {
          setContent("");
        } else {
          setContent(String(note_text));
        }
      }
    } else {
      toast({
        title: "Please open a file before typing or saving a file.",
        className: "non-transparent-hover"
      })
    }
  };

  // Call handleOpen when the component first renders
  useEffect(() => {
    handleOpen();
  }, [update]);

  const handleTyped = (e: { target: { value: React.SetStateAction<string>; }; }) => {
    if (opened_note) {
      setContent(e.target.value);
      note_text = content; 
    } else {
      toast({
        title: "Please open a file before typing or saving a file.",
        className: "non-transparent-hover"
      })
    }
  };

  return (
    <div className='relative w-full h-screen non-transparent-hover border-neutral-700 rounded-md'>
      {isEditing ? (
        <Textarea
          ref={textAreaRef}
          value={content}
          onChange={handleTyped}
          onKeyDown={handleKeyDown}
          placeholder='Type your notes here using Markdown.'
          id='typed notes'
          className='h-screen w-full border-neutral-700'
        />
      ) : (
        <div className={`h-full w-full overflow-auto p-4 border rounded-md markdown border-neutral-700 ${isDarkMode ? 'dark-mode-markdown' : ''}`}>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      )}
      <button onClick={toggleEditMode} className="absolute top-1 right-2 mt-1 px-2 py-2 bg-neutral-800 text-sm text-white rounded hover:bg-neutral-500 transition-colors duration-300">
        {isEditing ? 'Markdown' : 'Edit'}
      </button>
      <ClientConnect
        content={content}
        setContent={setContent}
        saved_note_id={saved_note_id}
      />
    </div>
  );
}

/**
 * Creates the resizable object between the card containing the folders and notes and the typing area. This function
 * is also called to construct the files card and the typing area.
 * @param param0 The string query typed into the search bar
 * @returns The resizable text and file card objects
 */
export function Resize() {
  return (

    <ResizablePanelGroup direction="horizontal">

      <ResizablePanel className="resizable-panel"><FilesCard/></ResizablePanel>
      {/* <ResizableHandle withHandle /> */}
      <ResizableHandle/>
      <ResizablePanel className="resizable-panel"><TypingArea/></ResizablePanel>
    </ResizablePanelGroup>

  )
}
 /**
  * Used to create the bold, italic and underline hotkeys
  * @param param0 An array of strings that indicated which of the hotkeys are active
  * @returns the hotkeys items
  */
export function HotKeys({ activeFormats, setActiveFormats, isDarkMode }: { activeFormats: string[], setActiveFormats: (formats: string[]) => void, isDarkMode: boolean }) {
  const handleFormatToggle = (format: string) => {
    if (activeFormats.includes(format)) {
      setActiveFormats(activeFormats.filter(f => f !== format));
    } else {
      setActiveFormats([...activeFormats, format]);
    }
  };

  return (
    <ToggleGroup type="multiple" variant="outline">
      <ToggleGroupItem value="bold" aria-label="Toggle bold" onClick={() => handleFormatToggle('bold')} className={`${isDarkMode ? "toggle-item-dark" : "toggle-item"}`}>
        <FontBoldIcon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="italic" aria-label="Toggle italic" onClick={() => handleFormatToggle('italic')} className={`${isDarkMode ? "toggle-item-dark" : "toggle-item"}`}>
        <FontItalicIcon className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="strikethrough" aria-label="Toggle strikethrough" onClick={() => handleFormatToggle('underline')} className={`${isDarkMode ? "toggle-item-dark" : "toggle-item"}`}>
        <UnderlineIcon className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}
 /**
  * The card that contains all of the files, notes, user details and functionality and the search bar
  * @param param0 The string query typed into the search bar
  * @returns The resizable files card
  */
 export function FilesCard() {
  const [searchQuery, setSearchQuery] = useState('');
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('your-notes');
  const { update } = useContext(UpdateContext);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const users = await getUserById(userId);
        setUsername(users[0].user_name);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    }

    fetchUsers();
  }, [update]);

  const handleTabChange = (value: string) => {
      setActiveTab(value);
      if (value === "shared-notes") {
        share_tab = true;
      } else {
        share_tab = false;
      }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  return (
    <Card className='h-screen w-full relative border-neutral-700 non-transparent-hover'>
      <CardHeader>
        <CardTitle className='relative mb-12'>
          <div className='absolute justify-center ml-12 my-3'>{username}'s Library</div>
          <AvatarHover/>
          <DateOrderSelector/>
        </CardTitle>
        <div className='relative'>
          <SearchBar onSearch={handleSearch} />
        </div>
      </CardHeader>
      <CardContent>
        <HotBar/>
        <Tabs defaultValue="your-notes" value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger className='border tab-hover hover:bg-neutral-800 hover:text-[#f8f5e6] transition-colors ease-in' value="your-notes">Your Notes</TabsTrigger>
            <TabsTrigger className='border tab-hover hover:bg-neutral-800 hover:text-[#f8f5e6] transition-colors ease-in' value="shared-notes">Shared Notes</TabsTrigger>
          </TabsList>
          <TabsContent value="your-notes">
            <p className='text-xl text-center text-font: underline mb-4'>
              <strong>Your Notes:</strong>
            </p>
            {share_tab ? <></>: <AllBooks searchQuery={searchQuery} />}
          </TabsContent>
          <TabsContent value="shared-notes">
            <p className='text-xl text-center text-font: underline mb-4'>
              <strong>Shared Notes:</strong>
            </p>
            {share_tab ? <SharedBooks searchQuery={searchQuery} /> : <></>}
            {/* <SharedBooks searchQuery={searchQuery} /> */}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}


/**
 * Creates the hover card and calls the user avatar function. The hover card is placed exactly on the user's avatar.
 * Also creates the content in the hovercard that contains the details of the user, as well as the buttons available
 * to edit the user's details.
 * @returns The hover card on the user avatar
 */
export function AvatarHover() {
  const [username, setUsername] = useState("")
  const [useremail, setUserEmail] = useState("")

  const { update, setUpdate } = useContext(UpdateContext);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const users = await getUserById(userId);
        setUsername(users[0].user_name);
        setUserEmail(users[0].email);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    }

    fetchUsers();
  }, [update]);

  const handleHover = () => {
    setUpdate((prev) => prev + 1);
  };

  return (
    <HoverCard>
      <HoverCardTrigger className='avatar-hover-trigger border-neutral-700' onMouseEnter={handleHover}><UserAvatar/></HoverCardTrigger>
      <HoverCardContent side="bottom" align='start' className='non-transparent-hover left-align'>
        <p className='mb-2'>Username: {username}</p>
        <p className='mb-2'>Email: {useremail}</p>
        <div className='mb-2'>
          <EditUserDetails/>
        </div>
        <div className='mb-2'>
          <EditUserPassword/>
        </div>
        <DeleteUserAccount/>
      </HoverCardContent>
    </HoverCard>
  )
}

/**
 * Creates the avatar of the user. If the user has no image, it is replaced by the initials of the user and a border is
 * added to the user's avatar if there is no avatar available.
 * @returns The users avatar
 */
export function UserAvatar() {
  const [userimage, setUserImage] = useState("");
  const { update } = useContext(UpdateContext);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const users = await getUserById(userId);
        setUserImage(users[0].image_url);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    }

    fetchUsers();
  }, [update]);

  return (
    <Avatar className='bg-red-600' >
      <AvatarImage src={userimage} alt = 'Profile Picture' />
      {/* <AvatarFallback className='no-user-avatar'>DS</AvatarFallback> */}
      <AvatarFallback>
        <Avatar>
          <AvatarImage src=''/>
        </Avatar>
      </AvatarFallback>
    </Avatar>
  )
}

/**
 * Creates a button to edit the users details, as well as a Dialog box to insert all of the new information.
 * @returns A button used to edit the users details.
 */
export function EditUserDetails() {

  const [username, setUsername] = useState("Username-from-db")
  const [useremail, setUserEmail] = useState("User-email@from.db")
  const [userimage, setUserImage] = useState("User image from db")
  const [open, setOpen] = useState(false)
  const { update, setUpdate } = useContext(UpdateContext);
  const [errors, setErrors] = useState<string[]>([]);
  const [temp_username, setTempUser] = useState('');
  const [temp_email, setTempEmail] = useState('');

  useEffect(() => {
    async function fetchUsers() {
      try {
        const users = await getUserById(userId);
        // Assuming the users[0] has the relevant data
        setUsername(users[0].user_name);
        setUserEmail(users[0].email);
        setUserImage(users[0].image_url);
      } catch (error) {
        console.error('Failed to fetch users', error);
      }
    }

    fetchUsers();
  }, [update]);

  const validateUserForm = (newErrors: string[]): boolean => {

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(useremail)) {
      newErrors.push('Invalid email address');
    }

    // Username validation
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(username)) {
      newErrors.push('Invalid username (3-20 characters, alphanumeric and underscores only)');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleUserNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setTempUser(username);
      setUsername(event.target.value); // Update the user name state

  };

  const handleUserEmailChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      setTempEmail(useremail);
      setUserEmail(event.target.value); // Update the user email state

  };

  const handleUserImageChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserImage(event.target.value); // Update the user image state


  };

  const handleCancel = () => {
    setOpen(false); // Close the dialog when Cancel is clicked
  };

  const handleChange = async () => {
    const newErrors: string[] = [];
    let isUnique = true;
    const existsInfo = await checkIfExists(username, useremail);
    if (existsInfo.user_used === 'username' && !(username === temp_username)) {
      newErrors.push('Username already exists');
      isUnique = false;
    }
    if (existsInfo.email_used === 'email' && !(useremail === temp_email)) {
      newErrors.push('Email already in use');
      isUnique = false;
    }

    if (validateUserForm(newErrors) && isUnique) {
      await updateUserInfo(userId, username, useremail);
      setOpen(false);

    }

    if (userimage) {
      // console.log('Image URL uploaded:', userimage);
      
      try {
        
        const result = await createUserImage(userId, userimage);
        // console.log('Image uploaded successfully:', result);
        setUpdate((prev) => prev + 1);
      } catch (err) {
        console.error('Failed to upload image:', err);
      } finally {
      }
    }    

  };

  const handleEditing = () => {
    setUpdate((prev) => prev + 1);
  }

  return (
    <Dialog
  open={open}
  onOpenChange={() => {setOpen(!open); setTempEmail(useremail); setTempUser(username)}}>
      <DialogTrigger asChild>
        <Button className="hover:bg-neutral-800 hover:text-[#f8f5e6]  non-transparent-hover" variant="outline" onClick={handleEditing}>Edit Profile</Button>
      </DialogTrigger>
      <DialogContent aria-describedby='edit user details' className='non-transparent-hover left-align sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {errors.length > 0 && (
            <Alert variant="destructive" className="mt-4 w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid Credentials</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
        )}

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              Username
            </Label>
            <Input id="username" value={username} onChange={handleUserNameChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="useremail" className="text-right">
              User Email
            </Label>
            <Input id="useremail" value={useremail} onChange={handleUserEmailChange} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="userimage" className="text-right">
              Avatar
            </Label>
            <div>
            <Input
                        type="url"
                        placeholder="Enter image URL (e.g., https://imgur.com/abcdef)"
                        value={userimage}
                        onChange={handleUserImageChange}
                        className="col-span-3 w-[280px]"
                    />
            </div>

          </div>
        </div>
        <DialogFooter className='flex'>
          <div className='flex-grow'>
            <Button variant="outline" className=' non-transparent-hover hover:bg-neutral-800 hover:text-[#f8f5e6]' onClick={handleCancel}>Cancel</Button>
          </div>
          <Button variant="outline" className=' non-transparent-hover hover:bg-neutral-800 hover:text-[#f8f5e6]' type="submit" onClick={handleChange}>Save changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * A way to edit the users passowrd
 * @returns A Dialog box to edit the users password
 */
export function EditUserPassword() {
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleCancel = () => {
    setOpen(false); // Close the dialog when Cancel is clicked
  };

  const validatePasswordChange = (): boolean => {
    const newErrors: string[] = [];

    // Password validation
    if (password.length < 8) {
      newErrors.push('Password must be at least 8 characters long');
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handlePasswordChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value); // Update the user email state
  };

  const handleChange = async () => {
    if (validatePasswordChange()){
      await updateUserPassword(userId, password)
      setOpen(false)
    }
  }

  const handleOpen = () => {
    setPassword("")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="hover:bg-neutral-800 hover:text-[#f8f5e6]  non-transparent-hover" variant="outline" onClick={handleOpen}>Change Password</Button>
      </DialogTrigger>
      <DialogContent aria-describedby='edit user details' className='non-transparent-hover left-align sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
          <DialogDescription>
            Change your password here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        {errors.length > 0 && (
            <Alert variant="destructive" className="mt-4 w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid Password</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
        )}
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="username" className="text-right">
              New Password
            </Label>
            <div className='relative col-span-3'>
              <Input
                        className="border-neutral-400"
                        id="passwrd"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter Password"
                        value={password}
                        onChange={handlePasswordChange}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute left-60 top-0 h-full px-3 py-2"
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOffIcon className="h-4 w-4" />
                        ) : (
                          <EyeIcon className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
          </div>
        </div>
        <DialogFooter className='flex'>
          <div className='flex-grow'>
            <Button variant="outline" className=" non-transparent-hover hover:bg-neutral-800 hover:text-[#f8f5e6]" onClick={handleCancel}>Cancel</Button>
          </div>
          <Button variant="outline" type="submit" className=' non-transparent-hover hover:bg-neutral-800 hover:text-[#f8f5e6]' onClick={handleChange}>Save password</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Creates an alert dialog box which alerts the user of the implication of deleting their acount
 * and the submit button to delete the account
 * @returns An Alert Dialog
 */
export function DeleteUserAccount() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false)

  const handleCancel = () => {
    setOpen(false); // Close the dialog when Cancel is clicked
  };

  const handleDelete = async () => {
   await deleteUser(userId);
   navigate("/");
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger className='alert font-normal text-sm transition-colors ease-in non-transparent-hover hover:text-[#f8f5e6]'>
        Delete Account
      </AlertDialogTrigger>
      <AlertDialogContent className='non-transparent-hover'>
        <AlertDialogHeader>
          <AlertDialogTitle>
            <div className='flex items-center'>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8 mr-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
            Are you absolutely sure you want to delete your account?
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete your account
            and remove your data from our servers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <div className='flex-grow'>
            <AlertDialogCancel className='non-transparent-hover hover:bg-neutral-800 hover:text-[#f8f5e6]' onClick={handleCancel}>Cancel</AlertDialogCancel>
          </div>
          <AlertDialogAction className='non-transparent-hover hover:bg-red-700 hover:text-[#f8f5e6]' onClick={handleDelete}>Delete Account</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/**
 * The function that adds the Selector used to select in which order the notes should be sorted
 * @returns A selector to select descending and ascending order.
 */
export function DateOrderSelector() {
  const { setUpdate } = useContext(UpdateContext);

  const handleSelect = (value: string) => {
    if (value === "Ascending order") {
      ascending = true;
      sortDate = true;
    } else {
      ascending = false;
      sortDate = true;
    }
    setUpdate((prev) => prev + 1);
  }


  return (
    <Select onValueChange={handleSelect}>
      <SelectTrigger className="date-selector hover:bg-neutral-800 hover:text-[#f8f5e6] transition-colors ease-in">
        <SelectValue className=" hover:bg-neutral-700 hover:text-[#f8f5e6] transition-colors ease-in" placeholder="Sort notes by date"/>
      </SelectTrigger>
      <SelectContent className="date-selector z-20">
        <SelectItem className='hover:underline transition-transform duration-200 ease-in' value="Ascending order">Ascending order</SelectItem>
        <SelectItem className='hover:underline transition ease-in' value="Descending order">Descending order</SelectItem>
      </SelectContent>
    </Select>
  )
}


/**
 * Creates a hotbar with buttons to create a new book, note and to save a note
 * @returns The hotbar with buttons to create a new book, note and to save a note
 */
export function HotBar() {
  const [open, onOpenChange] = useState(true);
  const [createNote, setCreateNote] = useState(false);
  const [createBook, setCreateBook] = useState(false);
  const { setUpdate } = useContext(UpdateContext);
  const { toast } = useToast();

  const handleCreateNote = () => {
    setCreateNote(true)
    setCreateBook(false)
    onOpenChange(true)
  }

  const handleCreateBook = () => {
    setCreateBook(true)
    setCreateNote(false)
    onOpenChange(true)
  }

  const handleSave = async () => {
    toast({
      title: "Your file has been saved successfully",
      className: "non-transparent-hover"
    })
    saved_note = true;
    setUpdate((prev) => prev + 1);
  }

  return (
    <>
      <div className='mb-6'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleCreateBook} className='hotbar-buttons hover:bg-neutral-800 transition-colors ease-in group'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 transition-transform duration-500 ease-in-out group-hover:scale-125 group-hover:stroke-neutral-100">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 10.5v6m3-3H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent className='non-transparent-hover'>
              <p>Create new book</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleCreateNote} className='hotbar-buttons hover:bg-neutral-800 transition-colors ease-in group'>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 transition-transform duration-500 ease-in-out group-hover:scale-125 group-hover:stroke-neutral-100">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent className='non-transparent-hover'>
              <p>Create new note</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={handleSave} className='hotbar-buttons hover:bg-neutral-800 transition-colors ease-in group'>
              <svg viewBox="0 0 24 24" className="size-6 transition-transform duration-500 ease-in-out group-hover:scale-125 group-hover:stroke-neutral-100" role="img" xmlns="http://www.w3.org/2000/svg" aria-labelledby="saveIconTitle" stroke="currentColor" strokeWidth={1.25} strokeLinecap="square" strokeLinejoin="miter" fill="none"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier">
                <title id="saveIconTitle">Save</title>
                <path d="M17.2928932,3.29289322 L21,7 L21,20 C21,20.5522847 20.5522847,21 20,21 L4,21 C3.44771525,21 3,20.5522847 3,20 L3,4 C3,3.44771525 3.44771525,3 4,3 L16.5857864,3 C16.8510029,3 17.1053568,3.10535684 17.2928932,3.29289322 Z"></path> <rect width="10" height="8" x="7" y="13"></rect> <rect width="8" height="5" x="8" y="3"></rect> </g>
              </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent className="non-transparent-hover">
              <p>Save current note</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      {createNote && <CreateNewNoteWithoutBook open={open} onOpenChange={onOpenChange}/>}
      {createBook && <CreateNewBook open={open} onOpenChange={onOpenChange}/>}
    </>
  )
}

interface CreateNewNoteWithoutBookProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Creates a card for creating a new note not contained in a book.
 * @param param0 If the card is open or not. Used for when cancel is pressed
 * @returns A create note card
 */
export function CreateNewNoteWithoutBook({open, onOpenChange}: CreateNewNoteWithoutBookProps) {
  const [note_name, setNoteName] = useState<string>("");
  const { setUpdate } = useContext(UpdateContext);

  const handleNewNote = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNoteName(event.target.value);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleCreate = async () => {
    await createNote(userId, note_name, -1);
    setUpdate((prev) => prev + 1);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='non-transparent-hover left-align sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Create a new note</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Provide a name for your new note.
          </DialogDescription>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Note's name
              </Label>
              <Input id="name" placeholder='Name of the note' value={note_name} onChange={handleNewNote} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <div className='flex-grow'>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
            <Button variant="outline" type="submit" onClick={handleCreate}>Create Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface CreateNewBookProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Creates a card used to create a new book
 * @param param0 If the card is open or not. Used for when cancel is pressed
 * @returns A create book card
 */
export function CreateNewBook({open, onOpenChange}: CreateNewBookProps) {
  const [name, setBookName] = useState("");
  const { setUpdate } = useContext(UpdateContext);

  const handleNewBook = (event: React.ChangeEvent<HTMLInputElement>) => {
    setBookName(event.target.value); // Update the name state
  };

  const handleCancel = () => {
    onOpenChange(false); // Close the dialog when Cancel is clicked
  };

  const handleCreate = async () => {
    await createCategory(userId, name);
    setUpdate((prev) => prev + 1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='non-transparent-hover left-align sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create a new book</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Provide a name for your new book.
        </DialogDescription>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Book's name
            </Label>
            <Input id="name" placeholder='Name of the book' value={name} onChange={handleNewBook} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <div className='flex-grow'>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
          <Button variant="outline" type="submit" onClick={handleCreate}>Create Book</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Gets all of the folders/books from the database/backend and displays them in the files card. Each
 * book may contain more notes.
 * @returns Collapsible Folders containing the folders from the database.
 */
export function AllBooks({ searchQuery }: { searchQuery: string }) {
  const { update } = useContext(UpdateContext);

  const [noBookNotes, setNoBookNotes] = useState<string[]>([]);
  const [noBookDates, setNoBookDates] = useState<string[]>([]);
  const [books, setBooks] = useState<string[]>([]);
  const [notes, setNotes] = useState<string[][]>([]);
  const [dates, setDates] = useState<string[][]>([]);
  const [allBookIds, setAllBookIds] = useState<number[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        // Get all of the books.
        const allBooks = await getCategoryByUserId(userId);
        const bookNames = allBooks.map((category: {category_name: any}) => category.category_name);
        setBooks(bookNames);

        const bookIds = allBooks.map((category: {category_id: any}) => category.category_id);

        const notesArray: string[][] = [];
        const notesDates: string[][] = [];

        // Get all of the notes for each book.
        for (const bookId of bookIds) {
          const notesForCategory = await getNotesForBooks(userId, bookId); // Fetch notes for the category using userId and categoryId

          // Convert the dates to Unix timestamps with millisecond precision
          const notesWithTimestampsBooks = notesForCategory.map((note: { edited_at: string, note_name: string }) => {
            const timestamp = new Date(note.edited_at).getTime() / 1000; // Convert to Unix timestamp (seconds with millisecond precision)
            return {
              timestamp,
              note_name: note.note_name
            };
          });

          const sortedNotesBooks = notesWithTimestampsBooks.sort((x: { timestamp: number, note_name: string }, y: { timestamp: number, note_name: any }) => {
            if (sortDate) {
              // Sorts the notes in ascending or descending order based on the last edited times
              return ascending ? x.timestamp - y.timestamp: y.timestamp - x.timestamp;
            } else {
              // Sorts the notes in ascending order in alphabetical order
              return x.note_name.localeCompare(y.note_name);
            }
          });

          // Extract the sorted timestamps and names
          const sortedTimestampsBooks = sortedNotesBooks.map((note: { timestamp: number; }) => note.timestamp);
          const sortedNamesBooks = sortedNotesBooks.map((note: { note_name: string; }) => note.note_name);

          // Use REGEX to clean the date.
          const formattedNoteEdited = sortedTimestampsBooks.map((timestamp: number) => {
            const date = new Date(timestamp * 1000);
            const isoString = date.toISOString();
            return isoString.replace(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}).\d{3}Z$/, '$1 $2');
          });
          notesArray.push(sortedNamesBooks);
          notesDates.push(formattedNoteEdited);
        }

        setNotes(notesArray);
        setAllBookIds(bookIds);
        setDates(notesDates);

        // Get all of the notes not contained in a book.
        const allNotes = await getNotesByOwnerId(userId);

        // Convert the dates to Unix timestamps with millisecond precision
        const notesWithTimestamps = allNotes.map((note: { edited_at: string, note_name: string }) => {
          const timestamp = new Date(note.edited_at).getTime() / 1000; // Convert to Unix timestamp (seconds with millisecond precision)
          return {
            timestamp,
            note_name: note.note_name
          };
        });

      const sortedNotes = notesWithTimestamps.sort((x: { timestamp: number, note_name: string }, y: { timestamp: number, note_name: any }) => {
        if (sortDate) {
          // Sorts the notes in ascending or descending order based on the last edited times
          return ascending ? x.timestamp - y.timestamp: y.timestamp - x.timestamp;
        } else {
          // Sorts the notes in ascending order in alphabetical order
          return x.note_name.localeCompare(y.note_name);
        }
      });

      // Extract the sorted timestamps and names
      const sortedTimestamps = sortedNotes.map((note: { timestamp: number; }) => note.timestamp);
      const sortedNames = sortedNotes.map((note: { note_name: string; }) => note.note_name);

      // Use REGEX to clean the date.
      const formattedNoteEdited = sortedTimestamps.map((timestamp: number) => {
        const date = new Date(timestamp * 1000);
        const isoString = date.toISOString();
        return isoString.replace(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}).\d{3}Z$/, '$1 $2');
      });

      setNoBookNotes(sortedNames);
      setNoBookDates(formattedNoteEdited);

      } catch (error) {
        console.error('Failed to fetch notes', error);
      }
    }

    fetchUsers();
  }, [update]);


  return (
    <ScrollArea className="h-[700px] w-[100%]">
      <div>
        {books.map((book, index) => (
          <Collapsible key={index} className="left-align relative mb-1">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 0 1 4.5 9.75h15A2.25 2.25 0 0 1 21.75 12v.75m-8.69-6.44-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
              </svg>
              <ContextMenuBooks book={book} index={books.indexOf(book)} />
              <NewFileForBook book={book} bookId={allBookIds[books.indexOf(book)]} />
            </div>
            <CollapsibleContent>
              <AllNotes notesArray={notes[books.indexOf(book)]} bookId={allBookIds[books.indexOf(book)]} dateArray={dates[books.indexOf(book)]} searchQuery={searchQuery}/>
            </CollapsibleContent>
          </Collapsible>
        ))}
        <AllNotesNoBook notesArray={noBookNotes} dateArray={noBookDates} searchQuery={searchQuery}/>

      </div>
    </ScrollArea>
  );
}

interface ContextMenuBooksProps {
  book: string;
  index: number;
}

/**
 * Creates a context menu for each book folder, and calls the function which creates the collapsible folder.
 * @param param0 The name of the current book and the index of the book
 * @returns A context menu for each book.
 */
export function ContextMenuBooks({book, index}: ContextMenuBooksProps) {
  const [deleteBook, setDeleteBook] = useState(false);
  const [editBook, setEditBook] = useState(false);
  const [open, onOpenChange] = useState(true);

  const handleDeleteBook = () => {
    setEditBook(false);
    setDeleteBook(true);
    onOpenChange(true);
  }

  const handleEditBook = () => {
    setDeleteBook(false);
    setEditBook(true);
    onOpenChange(true);
  }

  return (
    <>
      <ContextMenu key={index}>
        <ContextMenuTrigger><CollapsibleTrigger className="hover:underline cursor-pointer">{book}</CollapsibleTrigger></ContextMenuTrigger>
        <ContextMenuContent className='non-transparent-hover '>

          <ContextMenuItem onSelect={handleEditBook}>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              Rename Book
            </div>
          </ContextMenuItem>

          <ContextMenuItem onSelect={handleDeleteBook} >
          <div className="flex items-center hover:underline cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 ">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 13.5H9m4.06-7.19-2.12-2.12a1.5 1.5 0 0 0-1.061-.44H4.5A2.25 2.25 0 0 0 2.25 6v12a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9a2.25 2.25 0 0 0-2.25-2.25h-5.379a1.5 1.5 0 0 1-1.06-.44Z" />
            </svg>
            Delete Book
          </div>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {deleteBook && <DeleteBook open={open} book={book} onOpenChange={onOpenChange}/>}
      {editBook && <EditBookName open={open} book={book} onOpenChange={onOpenChange}/>}
    </>
  )
}

interface DeleteBookProps {
  open: boolean;
  book: string;
  onOpenChange: (open: boolean) => void;
}

/**
 * Creates an alert dialog box which alerts the user of the implication of deleting the book
 * and the submit button to delete the account
 * @returns An Alert Dialog
 */
export function DeleteBook({open, book, onOpenChange}: DeleteBookProps) {
  const { setUpdate } = useContext(UpdateContext);

  const handleCancel = () => {
    onOpenChange(false); // Close the dialog when Cancel is clicked
  };

  const handleDelete = async () => {
    await deleteCategory(userId, book);
    setUpdate((prev) => prev + 1);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby='delete a book' className='non-transparent-hover left-align sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Warning!</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you absolutely sure you want to delete your book {book} and all corresponding notes?
        </DialogDescription>
        <DialogFooter>
          <div className='flex-grow'>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
          <Button variant="outline" type="submit" onClick={handleDelete}>Delete Book</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EditBookNameProps {
  open: boolean;
  book: string;
  onOpenChange: (open: boolean) => void;
}

export function EditBookName({open, book, onOpenChange}: EditBookNameProps) {
  const { setUpdate } = useContext(UpdateContext);
  const [name, setEditBook] = useState("");

  const handleCancel = () => {
    onOpenChange(false); // Close the dialog when Cancel is clicked
  };

  const handleEditBook = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditBook(event.target.value);
  }

  const handleEdit = async () => {
    await updateCategoryName(userId, book, name);
    setUpdate((prev) => prev + 1);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='non-transparent-hover left-align sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Rename Your Book: {book}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Please provide the new name of your book.
        </DialogDescription>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Book's name
            </Label>
            <Input id="name" placeholder='New name of the book' value={name} onChange={handleEditBook} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <div className='flex-grow'>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
          <Button variant="outline" type="submit" onClick={handleEdit}>Rename Book</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface AllNotesProps {
  notesArray: string[];
  bookId: number;
  dateArray: string[];
}

interface AdditionalProps {
  searchQuery: string;
}

/**
 * Creates the links to each note from a book
 * @param param0 An array containing all of the notes from a book
 * @returns a list of notes of a book
 */
const AllNotes: React.FC<AllNotesProps & AdditionalProps> = ({ notesArray, bookId, dateArray, searchQuery }) => {
  const { isDarkMode } = useDarkMode();


  const filteredNotes = notesArray.filter(note =>
    note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      {filteredNotes.length > 0 ? (
        filteredNotes.map((note, index) => (
          <div className="flex items-center justify-between mb-1 " key={index}>
            <div className="flex items-center space-x-2 hover:underline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.49 12 3.75 3.75m0 0-3.75 3.75m3.75-3.75H3.74V4.499"
                />
              </svg>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                />
              </svg>
              <ContextMenuNotes note={note} index={index} bookId={bookId} />
            </div>

            <div className={`text-sm ${isDarkMode ? 'text-neutral-600 ' : 'text-neutral-400'} ml-8`}>
              Last Edited: {dateArray[index]}
            </div>
          </div>
        ))
      ) : (
        <div className={`text-sm ${isDarkMode ? 'text-neutral-600' : 'text-neutral-400'} ml-8`}>
          No notes found.
        </div>
      )}
    </div>
  );
}


interface AllNotesNoBookProps {
  notesArray: string[];
  dateArray: string[];
}

/**
 * Creates the links to each note from a book
 * @param param0 An array containing all of the notes from a book
 * @returns a list of notes of a book
 */
const AllNotesNoBook: React.FC<AllNotesNoBookProps & AdditionalProps> = ({ notesArray, dateArray, searchQuery }) => {
  const { isDarkMode } = useDarkMode();

  const filteredNotes = notesArray.filter(note =>
    note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      {filteredNotes.map((note, index) => (
        <div className="flex items-center justify-between mb-1 " key={index}>
          {/* Note content and icon */}
          <div className="flex items-center space-x-2 hover:underline">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="size-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
              />
            </svg>
            <ContextMenuNotes note={note} index={index} bookId={-1} />
          </div>

          <div className={`text-sm ${isDarkMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
            Last Edited: {dateArray[index]}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ContextMenuNotesProps {
  note: string;
  index: number;
  bookId: number;
}

/**
 * Creates the context menu for each note, that gives the option to delete, rename and share the note
 * @param param0 The note and the index of the note
 * @returns A note with a corresponding context menu
 */
export function ContextMenuNotes( {note, index, bookId}: ContextMenuNotesProps) {
  const [deleteNote, setDeleteNote] = useState(false);
  const [editNote, setEditNote] = useState(false);
  const [moveNote, setMoveNote] = useState(false);
  const [shareNote, setShareNote] = useState(false);
  const [open, onOpenChange] = useState(true);
  const { setUpdate } = useContext(UpdateContext);

  const handleDeleteNote = () => {
    setEditNote(false);
    setDeleteNote(true);
    setMoveNote(false);
    setShareNote(false);
    onOpenChange(true);
  }

  const handleEditNote = () => {
    setDeleteNote(false);
    setEditNote(true);
    setMoveNote(false);
    setShareNote(false);
    onOpenChange(true);
  }

  const handleMoveNote = () => {
    setEditNote(false);
    setDeleteNote(false);
    setMoveNote(true);
    setShareNote(false);
    onOpenChange(true);
  }

  const handleShareNote = () => {
    setEditNote(false);
    setDeleteNote(false);
    setMoveNote(false);
    setShareNote(true);
    onOpenChange(true);
  }

  const handleOpenNote = async () => {
    const content = await getNoteByName(userId, note, bookId);
    note_text = content[0].content;
    setUpdate((prev) => prev + 1);
    opened_note = true;
    saved_note_id = content[0].note_id;
    is_shared_note = false;
  }

  useEffect(() => {
    let intervalId: number | undefined;

    if (opened_note && !is_shared_note) {
      intervalId = window.setInterval(async () => {
        await saveNote(userId, saved_note_id, note_text);
        // console.log("Auto saving", saved_note_id);
      }, 5000);
    }

    // Cleanup function to clear the interval when the component unmounts or note changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        // console.log("AutoSave cleared");
      }
    };
  }, [saved_note_id]);

  return (
    <>
      <ContextMenu key={index}>
        <ContextMenuTrigger onClick={handleOpenNote}>{note}</ContextMenuTrigger>
        <ContextMenuContent className='non-transparent-hover'>

          <ContextMenuItem onSelect={handleEditNote}>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10" />
              </svg>
              Rename Note
            </div>
          </ContextMenuItem>

          <ContextMenuItem onSelect={handleMoveNote}>
            <div className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
              Move Note
            </div>
          </ContextMenuItem>

          <ContextMenuItem onSelect={handleShareNote}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
            Share Note
          </div>
          </ContextMenuItem>

          <ContextMenuItem onSelect={handleDeleteNote}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Delete Note
          </div>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {deleteNote && <DeleteNote open={open} note={note} onOpenChange={onOpenChange} bookId={bookId}/>}
      {editNote && <EditNoteName open={open} note={note} onOpenChange={onOpenChange} bookId={bookId}/>}
      {moveNote && <MoveNote open={open} note={note} onOpenChange={onOpenChange}/>}
      {shareNote && <ShareNote open={open} note={note} onOpenChange={onOpenChange} bookId={bookId}/>}
    </>
  )
}

interface DeleteNoteProps {
  open: boolean;
  note: string;
  onOpenChange: (open: boolean) => void;
  bookId: number;
}

/**
 * Creates an alert dialog box which alerts the user of the implication of deleting the note
 * and the submit button to delete the account
 * @returns An Alert Dialog
 */
export function DeleteNote({open, note, onOpenChange, bookId}: DeleteNoteProps) {
  const { setUpdate } = useContext(UpdateContext);

  const handleCancel = () => {
    onOpenChange(false); // Close the dialog when Cancel is clicked
  };

  const handleDelete = async () => {
    await deleteNote(userId, note, bookId);
    setUpdate((prev) => prev + 1);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby='delete a note' className='non-transparent-hover left-align sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Warning!</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you absolutely sure you want to delete your note file {note}?
        </DialogDescription>
        <DialogFooter>
          <div className='flex-grow'>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
          <Button variant="outline" type="submit" onClick={handleDelete}>Delete Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface EditNoteNameProps {
  open: boolean;
  note: string;
  onOpenChange: (open: boolean) => void;
  bookId: number;
}

export function EditNoteName({open, note, onOpenChange, bookId}: EditNoteNameProps) {
  const { setUpdate } = useContext(UpdateContext);
  const [name, setEditNote] = useState("");

  const handleCancel = () => {
    onOpenChange(false); // Close the dialog when Cancel is clicked
  };

  const handleEditNote = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEditNote(event.target.value);
  }

  const handleEdit = async () => {
    await updateNote(userId, bookId, note, name);
    setUpdate((prev) => prev + 1);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='non-transparent-hover left-align sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Rename Your Note: {note}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Please provide the new name of your note.
        </DialogDescription>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Note's name
            </Label>
            <Input id="name" placeholder='New name of the note' value={name} onChange={handleEditNote} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <div className='flex-grow'>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
          <Button variant="outline" type="submit" onClick={handleEdit}>Rename Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface MoveNoteProps {
  open: boolean;
  note: string;
  onOpenChange: (open: boolean) => void;
}

export function MoveNote({open, note, onOpenChange}: MoveNoteProps) {
  const { setUpdate } = useContext(UpdateContext);
  const [name, setMoveNoteTo] = useState("");
  const [isBook, setIsBook] = useState(true);

  const handleCancel = () => {
    onOpenChange(false); // Close the dialog when Cancel is clicked
    setIsBook(true);
  };

  const handleMoveNote = (event: React.ChangeEvent<HTMLInputElement>) => {
    setMoveNoteTo(event.target.value);
  }

  const handleMove = async () => {
    if (name !== "") {
      try {
        const book = await getCategoryByName(userId, name);
        await moveNote(userId, note, book[0].category_id);
        setUpdate((prev) => prev + 1);
        setIsBook(true);
        onOpenChange(false);
      } catch (error) {
        setIsBook(false);
      }
    } else {
      await moveNote(userId, note, -1);
      setIsBook(true);
      setUpdate((prev) => prev + 1);
      onOpenChange(false);
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className='non-transparent-hover left-align sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Move Your Note: {note}</DialogTitle>
          </DialogHeader>
          <DialogDescription>
            Please provide the book name you want to move the note to. If you want to move it to have no book, please provide an empty string.
          </DialogDescription>
          <div className="grid gap-4 py-4">
            {!isBook && (
              <Alert variant="destructive" className="mt-4 w-full">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Invalid Credentials</AlertTitle>
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    Book {name} does not exist. Please enter a valid book name.
                  </ul>
                </AlertDescription>
              </Alert>
            )}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Book's name
              </Label>
              <Input id="name" placeholder='Desitination of the note' value={name} onChange={handleMoveNote} className="col-span-3" />
            </div>
          </div>
          <DialogFooter>
            <div className='flex-grow'>
              <Button variant="outline" onClick={handleCancel}>Cancel</Button>
            </div>
            <Button variant="outline" type="submit" onClick={handleMove}>Move Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

interface ShareNoteProps {
  open: boolean;
  note: string;
  onOpenChange: (open: boolean) => void;
  bookId: number;
}

/**
 * Creates an alert dialog box which alerts the user of the implication of deleting the note
 * and the submit button to delete the account
 * @returns An Alert Dialog
 */
export function ShareNote({open, note, onOpenChange, bookId}: ShareNoteProps) {
  const { setUpdate } = useContext(UpdateContext);
  const [name, setShareNoteTo] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleShareNote = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShareNoteTo(event.target.value);
  }

  const validateNoteShare = (newErrors: string[]): boolean => {
    setErrors(newErrors);
    return newErrors.length === 0;
  }

  const handleShare = async () => {
    const user_info = await getUserByEmail(name);
    const newErrors: string[] = [];
    try {
      const user_email = user_info[0].email;
    } catch (error) {
      newErrors.push("Email doesn't exist");
    }

    if (validateNoteShare(newErrors)) {
      const note_info = await getNoteByName(userId, note, bookId);
      await createSharedNote(user_info[0].user_id as number, note_info[0].note_id as number);
      setUpdate((prev) => prev + 1);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='non-transparent-hover left-align sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Share Your Note: {note}</DialogTitle>
        </DialogHeader>
        {errors.length > 0 && (
            <Alert variant="destructive" className="mt-4 w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid Email</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
        )}
        <DialogDescription>
          Please provide the email address of the user you want to share the note with.
        </DialogDescription>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Book's name
            </Label>
            <Input id="name" placeholder="User's email of the note" value={name} onChange={handleShareNote} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <div className='flex-grow'>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
          <Button variant="outline" type="submit" onClick={handleShare}>Share Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
interface PassBookName {
  book: string;
  bookId: number;
}
/**
 * Creates a button for each book, which can create a new note.
 * @returns A Tooltip hover and button to create a new note in a book
 */
export function NewFileForBook({book, bookId}: PassBookName) {
  const [createNote, setCreateNote] = useState(false);
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button onClick={() => setCreateNote(true)} className='new-notes-button '>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
          </Button>
        </TooltipTrigger>
        <TooltipContent className='non-transparent-hover '>
          <p>Create new note</p>
        </TooltipContent>
      </Tooltip>
      <CreateNewNote open={createNote} book={book} onOpenChange={setCreateNote} bookId={bookId}/>
    </TooltipProvider>
  )
}


interface CreateNewNoteProps {
  open: boolean;
  book: string;
  onOpenChange: (open: boolean) => void;
  bookId: number;
}

/**
 * Create a new note for a specified book
 * @param param0 - Properties containing dialog state, book name, and open change handler
 * @returns A Dialog component for creating a new note
 */
export function CreateNewNote({ open, book, onOpenChange, bookId }: CreateNewNoteProps) {
  const [name, setNoteName] = useState("");
  const { setUpdate } = useContext(UpdateContext);

  const handleNewNote = (event: React.ChangeEvent<HTMLInputElement>) => {
    setNoteName(event.target.value);
  };

  const handleCancel = () => {
    onOpenChange(false); // Close the dialog when Cancel is clicked
  };

  const handleCreate = async () => {
    await createNote(userId, name, bookId);
    setUpdate((prev) => prev + 1);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='non-transparent-hover left-align sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Create a new note for book {book}</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Provide a name for your new note.
        </DialogDescription>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Note's name
            </Label>
            <Input id="name" placeholder='Name of the note' value={name} onChange={handleNewNote} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <div className='flex-grow'>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
          <Button variant="outline" type="submit" onClick={handleCreate}>Create Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/**
 * Gets all of the folders/books from the database/backend and displays them in the files card. Each
 * book may contain more notes.
 * @returns Collapsible Folders containing the folders from the database.
 */
export function SharedBooks({ searchQuery }: { searchQuery: string }) {
  const { update } = useContext(UpdateContext);

  const [noBookNotes, setNoBookNotes] = useState<string[]>([]);
  const [noBookDates, setNoBookDates] = useState<string[]>([]);
  const [noBookIds, setNoBookIds] = useState<number[]>([]);
  const [books, setBooks] = useState<string[]>([]);
  const [noteIds, setNoteIds] = useState<number[][]>([]);
  const [notes, setNotes] = useState<string[][]>([]);
  const [dates, setDates] = useState<string[][]>([]);
  const [allBookIds, setAllBookIds] = useState<number[]>([]);

  useEffect(() => {
    async function fetchUsers() {
      try {
        // Get all of the books.
        const note_ids = await getSharedNotesByUserID(userId);
        const AllNoteIds = note_ids.map((note_id: {note_id: any}) => note_id.note_id);
        const allBooks = await Promise.all(AllNoteIds.map(async (noteId: any) => {
          return await getNoteById(noteId);
        }));
        const BookIds = allBooks.flat().map((note: { category: any }) => note.category).filter((category) => category !== null);
        const AllBooks = await Promise.all(BookIds.map(async (category_id: number) => {
          return await getCategoryById(category_id);
        }));

        const bookIds = AllBooks.flat().map((category: {category_id: any}) => category.category_id);
        const presentBooks = Array.from(
          new Set(AllBooks.flat().map((category: {category_name: any}) => category.category_name))
        );
        setBooks(presentBooks);

        const notesArray: string[] = [];
        const notesDates: string[] = [];
        const notes_ids: number[] = [];

        // Gets the entries of the notes which has a book
        const booksIndex = allBooks.reduce((acc: number[], book, index) => {
          if (book[0].category !== null) {
            acc.push(index);
          }
          return acc;
        }, []);

        // Get all of the notes for each book.
        for (const bookId of booksIndex) {
          const notesForCategory = await getNoteById(allBooks.flat()[bookId].note_id);
          console.log("sjvfjds",notesForCategory)

          // Use REGEX to clean the date.
          const formattedNoteEdited = notesForCategory.map((note: {edited_at: string} ) => {
            return note.edited_at.replace(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}).\d{3}Z$/, '$1 $2');
          });
          notesArray.push(notesForCategory[0].note_name);
          notesDates.push(formattedNoteEdited[0]);
          notes_ids.push(notesForCategory[0].note_id);
        }

        const mergedArrays = groupByBookId(bookIds, notesArray, notesDates, notes_ids);
        const sortedArrays = sortGroupedData(mergedArrays);

        setNotes(sortedArrays.noteNames);
        setAllBookIds(bookIds);
        setDates(sortedArrays.lastEditedDates);
        setNoteIds(sortedArrays.noteIds);

        const NoBookIndices = allBooks.flat().reduce((indices: number[], note: { category: any }, index: number) => {
          if (note.category === null) {
            indices.push(index);
          }
          return indices;
        }, []);

        const notesNoBookArray: string[] = [];
        const notesNoBookDates: string[] = [];
        const notesNoBookIds: number[] = [];

        for (const NoBookIndex of NoBookIndices) {
          // Get all of the notes not contained in a book.
          const allNotes = await getNoteById(allBooks.flat()[NoBookIndex].note_id);
          // Use REGEX to clean the date.
          const formattedNoteEdited = allNotes.map((note: {edited_at: string} ) => {
            return note.edited_at.replace(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2}).\d{3}Z$/, '$1 $2');
          });
          notesNoBookArray.push(allNotes[0].note_name);
          notesNoBookDates.push(formattedNoteEdited);
          notesNoBookIds.push(allNotes[0].note_id);
        }

        const sortedNotesWithNoBook = sortNotesWithoutBook(notesNoBookArray, notesNoBookDates.flat(), notesNoBookIds);
        setNoBookNotes(sortedNotesWithNoBook.sortedNotesNoBookArray);
        setNoBookDates(sortedNotesWithNoBook.sortedNotesNoBookDates);
        setNoBookIds(sortedNotesWithNoBook.sortedNotesNoBookIds);

      } catch (error) {
        console.error('Failed to fetch notes', error);
      }
    }

    fetchUsers();
  }, [update]);


  return (
    <ScrollArea className="h-[700px] w-[100%]">
      <div>
        {books.map((book, index) => (
          <Collapsible key={index} className="left-align relative mb-1">
            <div className="flex items-center space-x-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6A2.25 2.25 0 014.5 3.75h6.189c.397 0 .779.158 1.06.44l2.12 2.12h5.38A2.25 2.25 0 0121.75 9v9a2.25 2.25 0 01-2.25 2.25h-15A2.25 2.25 0 012.25 18V6z"/>
                <circle cx="12" cy="13" r="2.25" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 17.25c0-1.104.896-2 2-2h3.5c1.104 0 2 .896 2 2v.5h-7.5v-.5z"/>
              </svg>
              <ContextMenuSharedBooks book={book} index={books.indexOf(book)} />
            </div>
            <CollapsibleContent>
              <AllSharedNotes notesArray={notes[books.indexOf(book)]} bookId={allBookIds[books.indexOf(book)]} dateArray={dates[books.indexOf(book)]} noteIds={noteIds[books.indexOf(book)]} searchQuery={searchQuery}/>
            </CollapsibleContent>
          </Collapsible>
        ))}
        <AllSharedNotesNoBook notesArray={noBookNotes} dateArray={noBookDates} noteIds={noBookIds} searchQuery={searchQuery}/>

      </div>
    </ScrollArea>
  );
}

function groupByBookId(bookIds: number[], noteNames: string[], lastEditedDates: string[], noteIds: number[]) {
  const groupedData: {
    noteNames: string[][],
    lastEditedDates: string[][],
    noteIds: number[][]
  } = {
    noteNames: [],
    lastEditedDates: [],
    noteIds: []
  };

  const bookIdMap: { [key: number]: number } = {};

  bookIds.forEach((bookId, index) => {
    if (bookIdMap[bookId] === undefined) {
      // If this book ID hasn't been seen, create new arrays for it
      bookIdMap[bookId] = groupedData.noteNames.length;
      groupedData.noteNames.push([noteNames[index]]);
      groupedData.lastEditedDates.push([lastEditedDates[index]]);
      groupedData.noteIds.push([noteIds[index]]);
    } else {
      // If this book ID is already in the map, push the values into existing arrays
      const groupIndex = bookIdMap[bookId];
      groupedData.noteNames[groupIndex].push(noteNames[index]);
      groupedData.lastEditedDates[groupIndex].push(lastEditedDates[index]);
      groupedData.noteIds[groupIndex].push(noteIds[index]);
    }
  });

  return groupedData;
}

function sortGroupedData(
  groupedData: {
    noteNames: string[][],
    lastEditedDates: string[][],
    noteIds: number[][]
  }
) {
  const toUnixTime = (date: string) => new Date(date).getTime();
  groupedData.noteNames.forEach((_, groupIndex) => {
    const combinedArray = groupedData.noteNames[groupIndex].map((name, i) => ({
      name,
      date: groupedData.lastEditedDates[groupIndex][i],
      noteId: groupedData.noteIds[groupIndex][i]
    }));
    combinedArray.sort((a, b) => {
      let comparison: number;

      if (sortDate) {
        // Compare by date (convert to Unix time)
        const dateA = toUnixTime(a.date);
        const dateB = toUnixTime(b.date);
        comparison = dateA - dateB;

        // Reverse the comparison if ascending is false
        return ascending ? comparison : -comparison;
      } else {
        comparison = a.name.localeCompare(b.name);
        return comparison;
      }
    });
    groupedData.noteNames[groupIndex] = combinedArray.map(item => item.name);
    groupedData.lastEditedDates[groupIndex] = combinedArray.map(item => item.date);
    groupedData.noteIds[groupIndex] = combinedArray.map(item => item.noteId);
  });

  return groupedData;
}

function sortNotesWithoutBook(
  notesNoBookArray: string[],
  notesNoBookDates: string[],
  notesNoBookIds: number[]
) {
  const toUnixTime = (date: string) => new Date(date).getTime();
  const combinedArray = notesNoBookArray.map((name, i) => ({
    name,
    date: notesNoBookDates[i],
    noteId: notesNoBookIds[i]
  }));

  combinedArray.sort((a, b) => {
    let comparison: number;

    if (sortDate) {
      const dateA = toUnixTime(a.date);
      const dateB = toUnixTime(b.date);
      comparison = dateA - dateB;

      return ascending ? comparison : -comparison;
    } else {
      comparison = a.name.localeCompare(b.name);
      return comparison;
    }
  });
  const sortedNotesNoBookArray = combinedArray.map(item => item.name);
  const sortedNotesNoBookDates = combinedArray.map(item => item.date);
  const sortedNotesNoBookIds = combinedArray.map(item => item.noteId);

  return {
    sortedNotesNoBookArray,
    sortedNotesNoBookDates,
    sortedNotesNoBookIds
  };
}

interface ContextMenuSharedBooksProps {
  book: string;
  index: number;
}

/**
 * Creates a context menu for each book folder, and calls the function which creates the collapsible folder.
 * @param param0 The name of the current book and the index of the book
 * @returns A context menu for each book.
 */
export function ContextMenuSharedBooks({book, index}: ContextMenuSharedBooksProps) {
  return (
    <>
      <ContextMenu key={index}>
        <ContextMenuTrigger><CollapsibleTrigger className="hover:underline cursor-pointer">{book}</CollapsibleTrigger></ContextMenuTrigger>
      </ContextMenu>
    </>
  )
}

interface AllSharedNotesProps {
  notesArray: string[];
  bookId: number;
  dateArray: string[];
  noteIds: number[];
}

interface AdditionalSharedProps {
  searchQuery: string;
}

/**
 * Creates the links to each note from a book
 * @param param0 An array containing all of the notes from a book
 * @returns a list of notes of a book
 */
const AllSharedNotes: React.FC<AllSharedNotesProps & AdditionalSharedProps> = ({ notesArray, bookId, dateArray, noteIds, searchQuery }) => {
  const { isDarkMode } = useDarkMode();


  const filteredNotes = notesArray.filter(note =>
    note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      {filteredNotes.length > 0 ? (
        filteredNotes.map((note, index) => (
          <div className="flex items-center justify-between mb-1 " key={index}>
            <div className="flex items-center space-x-2 hover:underline">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m16.49 12 3.75 3.75m0 0-3.75 3.75m3.75-3.75H3.74V4.499"
                />
              </svg>

              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
              </svg>

              <ContextMenuSharedNotes note={note} index={index} noteId={noteIds[index]} bookId={bookId} />
            </div>

            <div className={`text-sm ${isDarkMode ? 'text-neutral-600 ' : 'text-neutral-400'} ml-8`}>
              Last Edited: {dateArray[index]}
            </div>
          </div>
        ))
      ) : (
        <div className={`text-sm ${isDarkMode ? 'text-neutral-600' : 'text-neutral-400'} ml-8`}>
          No notes found.
        </div>
      )}
    </div>
  );
}

interface AllSharedNotesNoBookProps {
  notesArray: string[];
  dateArray: string[];
  noteIds: number[];
}

/**
 * Creates the links to each note from a book
 * @param param0 An array containing all of the notes from a book
 * @returns a list of notes of a book
 */
const AllSharedNotesNoBook: React.FC<AllSharedNotesNoBookProps & AdditionalSharedProps> = ({ notesArray, dateArray, noteIds, searchQuery }) => {
  const { isDarkMode } = useDarkMode();

  const filteredNotes = notesArray.filter(note =>
    note.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col">
      {filteredNotes.map((note, index) => (
        <div className="flex items-center justify-between mb-1 " key={index}>
          {/* Note content and icon */}
          <div className="flex items-center space-x-2 hover:underline">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
            </svg>
            <ContextMenuSharedNotes note={note} index={index} noteId={noteIds[index]} bookId={-1} />
          </div>

          <div className={`text-sm ${isDarkMode ? 'text-neutral-600' : 'text-neutral-400'}`}>
            Last Edited: {dateArray[index]}
          </div>
        </div>
      ))}
    </div>
  );
}

interface ContextMenuSharedNotesProps {
  note: string;
  index: number;
  noteId: number
  bookId: number;
}

/**
 * Creates the context menu for each note, that gives the option to remove and share the note
 * @param param0 The note and the index of the note
 * @returns A note with a corresponding context menu
 */
export function ContextMenuSharedNotes( {note, index, noteId}: ContextMenuSharedNotesProps) {
  const [removeNote, setRemoveNote] = useState(false);
  const [shareNote, setShareNote] = useState(false);
  const [open, onOpenChange] = useState(true);
  const { setUpdate } = useContext(UpdateContext);

  const handleRemoveNote = () => {
    setRemoveNote(true);
    setShareNote(false);
    onOpenChange(true);
  }

  const handleShareNote = () => {
    setRemoveNote(false);
    setShareNote(true);
    onOpenChange(true);
  }

  const handleOpenNote = async () => {
    const content = await getNoteById(noteId);
    note_text = content[0].content;
    setUpdate((prev) => prev + 1);
    opened_note = true;
    saved_note_id = content[0].note_id;
    is_shared_note = true;
  }

  useEffect(() => {
    let intervalId: number | undefined;

    if (opened_note && is_shared_note) {
      intervalId = window.setInterval(async () => {
        await saveSharedNote(saved_note_id, note_text);
      }, 5000);
    }

    // Cleanup function to clear the interval when the component unmounts or note changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [saved_note_id]);

  return (
    <>
      <ContextMenu key={index}>
        <ContextMenuTrigger onClick={handleOpenNote}>{note}</ContextMenuTrigger>
        <ContextMenuContent className='non-transparent-hover'>

          <ContextMenuItem onSelect={handleShareNote}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z" />
            </svg>
            Share Note
          </div>
          </ContextMenuItem>

          <ContextMenuItem onSelect={handleRemoveNote}>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m6.75 12H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            Remove Shared Note
          </div>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {removeNote && <RemoveNote open={open} note={note} onOpenChange={onOpenChange} noteId={noteId}/>}
      {shareNote && <ShareSharedNote open={open} note={note} onOpenChange={onOpenChange} noteId={noteId}/>}
    </>
  )
}

interface RemoveNoteProps {
  open: boolean;
  note: string;
  onOpenChange: (open: boolean) => void;
  noteId: number;
}

/**
 * Creates an alert dialog box which alerts the user of the implication of deleting the note
 * and the submit button to delete the account
 * @returns An Alert Dialog
 */
export function RemoveNote({open, note, onOpenChange, noteId}: RemoveNoteProps) {
  const { setUpdate } = useContext(UpdateContext);

  const handleCancel = () => {
    onOpenChange(false); // Close the dialog when Cancel is clicked
  };

  const handleRemove = async () => {
    await removeSharedNote(userId, noteId);
    setUpdate((prev) => prev + 1);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby='delete a note' className='non-transparent-hover left-align sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Warning!</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you absolutely sure you want to remove the note file {note} from your shared notes list?
        </DialogDescription>
        <DialogFooter>
          <div className='flex-grow'>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
          <Button variant="outline" type="submit" onClick={handleRemove}>Remove Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface ShareSharedNoteProps {
  open: boolean;
  note: string;
  onOpenChange: (open: boolean) => void;
  noteId: number;
}

/**
 * Creates an alert dialog box which alerts the user of the implication of deleting the note
 * and the submit button to delete the account
 * @returns An Alert Dialog
 */
export function ShareSharedNote({open, note, onOpenChange, noteId}: ShareSharedNoteProps) {
  const { setUpdate } = useContext(UpdateContext);
  const [name, setShareNoteTo] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleCancel = () => {
    onOpenChange(false);
  };

  const handleShareNote = (event: React.ChangeEvent<HTMLInputElement>) => {
    setShareNoteTo(event.target.value);
  }

  const validateNoteShare = (newErrors: string[]): boolean => {
    setErrors(newErrors);
    return newErrors.length === 0;
  }

  const handleShare = async () => {
    const user_info = await getUserByEmail(name);
    const newErrors: string[] = [];
    try {
      const user_email = user_info[0].email;
      console.log(user_info[0].email);
    } catch (error) {
      newErrors.push("Email doesn't exist");
    }

    if (validateNoteShare(newErrors)) {
      await createSharedNote(user_info[0].user_id as number, noteId);
      setUpdate((prev) => prev + 1);
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='non-transparent-hover left-align sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle>Share Your Note: {note}</DialogTitle>
        </DialogHeader>
        {errors.length > 0 && (
            <Alert variant="destructive" className="mt-4 w-full">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Invalid Email</AlertTitle>
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
        )}
        <DialogDescription>
          Please provide the email address of the user you want to share the note with.
        </DialogDescription>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Book's name
            </Label>
            <Input id="name" placeholder="User's email of the note" value={name} onChange={handleShareNote} className="col-span-3" />
          </div>
        </div>
        <DialogFooter>
          <div className='flex-grow'>
            <Button variant="outline" onClick={handleCancel}>Cancel</Button>
          </div>
          <Button variant="outline" type="submit" onClick={handleShare}>Share Note</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
