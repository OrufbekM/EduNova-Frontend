import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { toast } from '../../utils/toast';
import './css/login.css';
import BacImg from '../../assets/imgs/bac.png'
import LogoImg from '../../assets/imgs/logoLight.png'

class LoginClass extends React.Component {
  constructor(props) {
    super(props);
    
    this.state = {
      signupName: '',
      signupEmail: '',
      signupPassword: '',
      signupConfirmPassword: '',
      
      loginEmail: '',
      loginPassword: '',
      
      isLoading: false
    };
  }

  signupSwitcher = () => {
    const switcherbg = document.querySelector('.switcherbg');
    const signupswitcher = document.querySelector('.signupswitcher');
    const loginswitcher = document.querySelector('.loginswitcher');
    const formsHolder = document.querySelector('.forms-holder');
    const greetingSignup = document.querySelector('.greeting-signup');
    const greetingLogin = document.querySelector('.greeting-login');
    
    formsHolder.style.transform = 'translateX(-0%)';
    greetingSignup.style.transform = 'translateX(0px)';
    greetingLogin.style.transform = 'translateX(300px)';
    signupswitcher.style.color = 'var(--dark1)';
    loginswitcher.style.color = 'var(--white1)';
    switcherbg.classList.add('left');
    switcherbg.classList.remove('right');
  }

  loginSwitcher = () => {
    const switcherbg = document.querySelector('.switcherbg');
    const signupswitcher = document.querySelector('.signupswitcher');
    const loginswitcher = document.querySelector('.loginswitcher');
    const formsHolder = document.querySelector('.forms-holder');
    const greetingSignup = document.querySelector('.greeting-signup');
    const greetingLogin = document.querySelector('.greeting-login');
    
    formsHolder.style.transform = 'translateX(-50%)';
    greetingSignup.style.transform = 'translateX(-300px)';
    greetingLogin.style.transform = 'translateX(0px)';
    signupswitcher.style.color = 'var(--white1)';
    loginswitcher.style.color = 'var(--dark1)';
    switcherbg.classList.add('right');
    switcherbg.classList.remove('left');
  }

  handleInputChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value
    });
  }


  validateSignupForm = () => {
    const { signupName, signupEmail, signupPassword, signupConfirmPassword } = this.state;
    
    if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
      toast.error('All fields are required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    if (signupPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return false;
    }
    
    if (signupPassword !== signupConfirmPassword) {
      toast.error('Passwords do not match');
      return false;
    }
    
    return true;
  }

  validateLoginForm = () => {
    const { loginEmail, loginPassword } = this.state;
    
    if (!loginEmail || !loginPassword) {
      toast.error('Email and password are required');
      return false;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginEmail)) {
      toast.error('Please enter a valid email address');
      return false;
    }
    
    return true;
  }

  handleSignup = async (e) => {
    e.preventDefault();
    
    if (!this.validateSignupForm()) {
      return;
    }
    
    this.setState({ isLoading: true });
    
    try {
      await this.props.signup(this.state.signupEmail, this.state.signupPassword, this.state.signupConfirmPassword);
      
      toast.success('Account created successfully! You can now login.');
      
      this.setState({
        isLoading: false,
        signupName: '',
        signupEmail: '',
        signupPassword: '',
        signupConfirmPassword: ''
      });
      
      setTimeout(() => {
        this.loginSwitcher();
      }, 2000);
      
    } catch (error) {
      toast.error(error.message || 'Signup failed. Please try again.');
      this.setState({ isLoading: false });
    }
  }

  // Handles Login form submission
  handleLogin = async (e) => {
    e.preventDefault();
    
    if (!this.validateLoginForm()) {
      return;
    }
    
    this.setState({ isLoading: true });
    
    try {
      await this.props.login(this.state.loginEmail, this.state.loginPassword);
      
      toast.success('Login successful! Redirecting...');
      
      setTimeout(() => {
        window.location.href = '/';
      }, 1500);
      
    } catch (error) {
      toast.error(error.message || 'Login failed. Please check your credentials.');
      this.setState({ isLoading: false });
    }
  }

  render() {
    const {
      signupName,
      signupEmail,
      signupPassword,
      signupConfirmPassword,
      loginEmail,
      loginPassword,
      isLoading
    } = this.state;

    return (
      <div className="loginpage" style={{ background: `url(${BacImg}) no-repeat center center/cover` }}>
        <div className="greeting-container">
          <div className="greeting-signup">
            <h1 style={{ color: 'white' }}>Welcome to</h1>
          </div>
          <div className="greeting-login">
            <h1 style={{ color: 'white' }}>Welcome back to</h1>
          </div>
        </div>
        
        <div className="mytitle">
          EduBoard <div className="mylogo" style={{ backgroundImage: `url(${LogoImg})` }}></div>
        </div>
        
        <div className='login-container'>
          <div className="switcher">
            <div className="switcherbg left"></div>
            <div onClick={this.signupSwitcher} className="signupswitcher">Sign Up</div>
            <div onClick={this.loginSwitcher} className="loginswitcher">Login</div>
          </div>
          
          <div className="forms-holder">
            {/* SIGNUP FORM */}
            <form className='signup-form' onSubmit={this.handleSignup}>
              <input
                type='text'
                name='signupName'
                placeholder='Full Name'
                value={signupName}
                onChange={this.handleInputChange}
                disabled={isLoading}
              />
              <input
                type='email'
                name='signupEmail'
                placeholder='Email'
                value={signupEmail}
                onChange={this.handleInputChange}
                disabled={isLoading}
              />
              <input
                type='password'
                name='signupPassword'
                placeholder='Password'
                value={signupPassword}
                onChange={this.handleInputChange}
                disabled={isLoading}
              />
              <input
                type='password'
                name='signupConfirmPassword'
                placeholder='Confirm Password'
                value={signupConfirmPassword}
                onChange={this.handleInputChange}
                disabled={isLoading}
              />
              <button type='submit' disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
            
            {/* LOGIN FORM */}
            <form className='login-form' onSubmit={this.handleLogin}>
              <input
                type='email'
                name='loginEmail'
                placeholder='Email'
                value={loginEmail}
                onChange={this.handleInputChange}
                disabled={isLoading}
              />
              <input
                type='password'
                name='loginPassword'
                placeholder='Password'
                value={loginPassword}
                onChange={this.handleInputChange}
                disabled={isLoading}
              />
              <button type='submit' disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }
}

const Login = () => {
  const { signup, login, loading, error, success, clearMessages } = useAuth();
  
  return (
    <LoginClass 
      signup={signup}
      login={login}
      loading={loading}
      error={error}
      success={success}
      clearMessages={clearMessages}
    />
  );
};

export default Login;