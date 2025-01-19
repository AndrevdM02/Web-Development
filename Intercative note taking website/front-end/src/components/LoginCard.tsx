import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from "react-router-dom";
import React from "react";
import DarkModeToggle from '../DarkModeToggle';
import { useDarkMode } from "../DarkModeContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ImageUploadModal from './ImageUploadModal'; // Import the modal
import '../App.css';
import { AlertCircle, EyeIcon, EyeOffIcon } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createUser, checkIfExists, login, getSession, createUserImage } from '../../../backend/src/frontEndRequests';

var userId = -1;

export const LoginCard: React.FC = () => {
  const navigate = useNavigate(); // Initialize the useNavigate hook
  const { isDarkMode } = useDarkMode()
  const [activeTab, setActiveTab] = useState('account'); // Default to 'account' for login
  const [isModalOpen, setModalOpen] = useState(false); // State for the modal
  const [uploadedImage, setUploadedImage] = useState<File | null>(null); // State for uploaded image
  const [username, setUsername] = useState("")
  const [useremail, setUserEmail] = useState("")
  const [password, setPassword] = useState("")
  const [errors, setErrors] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleUsername = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(event.target.value);
  };

  const handleUserEmail = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUserEmail(event.target.value);
  };

  const handlePassword = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
  };


  const handleSignIn = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    let login_res
    try {
      login_res = await login(username, password);
    } catch (error) {
      console.warn('login failed', error);
    }


    if (login_res?.status == 404) {
    let temp = await getSession();
    console.log(temp);
    userId = temp.user.id as number;
    console.log(temp.user.id);
    console.log(userId);
    navigate("/notes", {state: { userId }});
    } else {
      // Show login failed message!!
    }


  };

    const validateForm = (newErrors: string[]): boolean => {

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(useremail)) {
        newErrors.push('Invalid email address');
      }

      // Password validation
      if (password.length < 8) {
        newErrors.push('Password must be at least 8 characters long');
      }

      // Username validation
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(username)) {
        newErrors.push('Invalid username (3-20 characters, alphanumeric and underscores only)');
      }

      setErrors(newErrors);
      return newErrors.length === 0;
    };





  const handleSignUp = async () => {
    const newErrors: string[] = [];
    let isUnique = true;
    const existsInfo = await checkIfExists(username, useremail);
    if (existsInfo.user_used === 'username') {
      newErrors.push('Username already exists');
      isUnique = false;
    }
    if (existsInfo.email_used === 'email') {
      newErrors.push('Email already in use');
      isUnique = false;
    }

    if (validateForm(newErrors) && isUnique) {
      try {
        userId = await createUser(username, password, useremail);
      } catch (error) {
        console.error('Failed to create user', error);
      }

      setModalOpen(true)
    }
  };


  const handleUpload = async (imageUrl: string | null) => {
    
    if (imageUrl) {
      console.log('Image URL uploaded:', imageUrl);
      
      try {
        
        const result = await createUserImage(userId, imageUrl);
        console.log('Image uploaded successfully:', result);
        // Handle successful upload (e.g., update user profile state, show success message)
      } catch (err) {
        console.error('Failed to upload image:', err);
      } finally {
      }
    } else {
      console.log('User skipped image upload');
      // Add your logic for when the user skips
    }
    setModalOpen(false);
    navigate("/notes", { state: { userId } });
  };



  return (
    <div className={`fixed inset-0 bg-cover bg-center bg-no-repeat overflow-auto transition-all duration-500 ease-in-out ${isDarkMode ? "bg-[url('/src/logos/png/dark_mode_backdrop.jpg')]" : "bg-[url('/src/logos/png/light_mode_backdrop.jpg')]"}`}>
    <div className="flex items-center justify-center p-20">
     <Tabs defaultValue="account" value={activeTab} onValueChange={setActiveTab} className="w-[600px]">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger className={`border border-neutral-600 transition-all duration-300 ease-in-out hover:text-neutral-100 hover:bg-neutral-800 ${isDarkMode ? 'hover-button-dark' : 'hover-button'}`} value="account">Login</TabsTrigger>
        <TabsTrigger className={`border border-neutral-600 transition-all duration-300 ease-in-out hover:text-neutral-100 hover:bg-neutral-800  ${isDarkMode ? 'hover-button-dark' : 'hover-button'}`} value="password">Sign Up</TabsTrigger>
      </TabsList>
      <TabsContent  value="account">
      <Card className="w-[600px] h-[525px] shadow-2xl shadow-slate-600 border-neutral-700 justify-center space-y-2 non-transparent-hover">

        <CardHeader className={`border-b rounded-xl border-neutral-400 ${isDarkMode ? 'header-bg-dark' : 'header-bg'}`}>
          <CardTitle >Welcome Back! Please login</CardTitle>
          <CardDescription>Continue to your library now.</CardDescription>
        </CardHeader>
        <CardContent className={`transition-opacity duration-300 ease-in-out ${activeTab === "account" ? "opacity-100" : "opacity-0"}`}>
          <form>
            <div className="grid w-fullitems-ce gap-4">
              <div className="flex flex-col space-y-1.5">
                <DarkModeToggle />
                <Label htmlFor="name">Username</Label>
                <Input className="border-neutral-400" id="name" placeholder="Enter Username" value={username} onChange={handleUsername} />

                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="passwrd">Password</Label>
                  <div className="relative">
                    <Input
                      className="border-neutral-400 pr-10"
                      id="passwrd"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter Password"
                      value={password}
                      onChange={handlePassword}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3 py-2"
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

              <div className="text-center my-1">
              <div>
                    Click{' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('password')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      here
                    </button>{' '}
                    to sign up if you're new!
                  </div>
              </div>
            </div>

          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
        <Button
        variant="outline"
        className="relative inline-block border border-neutral-400 w-[250px] rounded-lg overflow-hidden group transition-all duration-300 ease-in-out transform hover:scale-105"
        onClick={handleSignIn}
      >
        <span className="absolute inset-0 w-full h-full bg-neutral-800 px-4 py-2 transition-transform duration-300 transform -translate-y-full group-hover:translate-y-0"></span>
        <span className="relative transition-colors duration-300 group-hover:text-white group-hover:underline">Log In!</span>
      </Button>
        </CardFooter>
        <div className="flex items-center justify-center h-24">
          <img src={`${isDarkMode ? "src/logos/png/library-of-alexandria-high-resolution-logo-white-transparent.png" : "/src/logos/png/logo-no-background.png"}`} alt="Logo Floating" className="w-96 h-auto"></img>
        </div>
      </Card>

      </TabsContent>
      <TabsContent value="password">
      <Card className={`w-[600px] h-[525px] shadow-2xl shadow-slate-600 border-neutral-700 justify-center space-y-2 ${isDarkMode ? 'bg-neutral-950' : 'non-transparent-hover'}`}>
        <CardHeader className={`border-b rounded-xl border-neutral-400 ${isDarkMode ? 'header-bg-dark' : 'header-bg'}`}>
          <CardTitle>Welcome! Please fill in your details!</CardTitle>
          <CardDescription>Start your library now.</CardDescription>
        </CardHeader>
        <CardContent>
          <form>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <DarkModeToggle/>
                <Label htmlFor="name">Username</Label>
                <Input className="border-neutral-400" id="name" placeholder="Enter Username" value={username} onChange={handleUsername} />

                <Label htmlFor="passwrd">Email</Label>
                <Input className="border-neutral-400" id="passwrd" placeholder="Enter Email" value={useremail} onChange={handleUserEmail} />

                <Label htmlFor="passwrd">Password</Label>
                <div className="relative">
                  <Input
                    className="border-neutral-400 pr-10"
                    id="passwrd"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter Password"
                    value={password}
                    onChange={handlePassword}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2"
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

              <div className="text-center">
              <div>
                    Already have an account? Click {' '}
                    <button
                      type="button"
                      onClick={() => setActiveTab('account')}
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      here
                    </button>{' '}
                    to log in!
                  </div>


                {errors.length > 0 && (
                        <Alert variant="destructive" className="mt-4 w-full">
                          <AlertCircle className="h-4 w-4" />
                          <AlertTitle>Invalid Sign Up Credentials</AlertTitle>
                          <AlertDescription>
                            <ul className="list-disc list-inside">
                              {errors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}

              </div>
            </div>

          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
        <Button
          variant="outline"
          className="relative inline-block border border-neutral-400 w-[250px] rounded-lg overflow-hidden group transition-all duration-300 ease-in-out transform hover:scale-105"
          onClick={() => {
            handleSignUp();
          }}
        >
          <span className="absolute inset-0 w-full h-full bg-neutral-800 px-4 py-2 transition-transform duration-300 transform -translate-y-full group-hover:translate-y-0"></span>
          <span className="relative transition-colors duration-300 group-hover:text-white group-hover:underline">Sign Up!</span>
        </Button>



        </CardFooter>
        <div className="flex items-center justify-center h-24">

          <img src={`${isDarkMode ? "src/logos/png/library-of-alexandria-high-resolution-logo-white-transparent.png" : "/src/logos/png/logo-no-background.png"}`} alt="Logo Floating" className="w-96 h-auto"></img>


        </div>

      </Card>
      </TabsContent>
    </Tabs>
          
    <ImageUploadModal
        isOpen={isModalOpen}
        onClose={() => setModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>

    </div>
  )
}
export default LoginCard;
