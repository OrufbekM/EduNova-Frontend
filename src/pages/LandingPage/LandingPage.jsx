import React, { Component } from 'react'
import './LandingPage.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import WhyEduNova from './components/WhyEduNova'
import HowItWorks from './components/HowItWorks'
import Footer from './components/Footer'

class LandingPage extends Component {
  render() {
    return (
      <div className="landing-page">
        <Navbar onShowAuth={this.props.onShowAuth} />
        <main>
          <Hero onShowAuth={this.props.onShowAuth} />
          <WhyEduNova onShowAuth={this.props.onShowAuth} />
          <HowItWorks />
          <Footer onShowAuth={this.props.onShowAuth} />
        </main>
      </div>
    )
  }
}

export default LandingPage
