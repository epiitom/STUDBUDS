import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react"
import { FileText, GraduationCap, LayoutDashboard, PenBox, Stars, Menu } from 'lucide-react'
import { useNavigate } from "react-router-dom"

import { useState } from "react";

const Header = () => {
    const navigate = useNavigate();
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="header">
            <nav className="nav">
                <div className="nav-logo">
                    <span className="logo-text">Study</span>
                    <span className="logo-accent">Buds</span>
                </div>

                <button className="mobile-menu-btn" onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                    <Menu size={24} />
                </button>

                <div className={`nav-items ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
                    <SignedIn>
                        <button className="dashboard-btn" onClick={() => navigate('/app')}>
                            <LayoutDashboard className="dashboard-icon" />
                            <span className="dashboard-text">Dashboard</span>
                        </button>

                        <div className="dropdown">
                            <button
                                className="dropdown-btn"
                                onClick={() => setDropdownOpen(!isDropdownOpen)}
                            >
                                <Stars className="dropdown-icon" />
                                <span className="dropdown-text">Tools</span>
                            </button>

                            {isDropdownOpen && (
                                <div className="dropdown-menu">
                                    <button className="dropdown-item" onClick={() => navigate("/app")}>
                                        <GraduationCap className="menu-icon" />
                                        Study Prep
                                    </button>
                                   
                                </div>
                            )}
                        </div>
                    </SignedIn>

              

                    <SignedOut>
                        <SignInButton>
                            <button className="sign-in-btn">Sign In</button>
                        </SignInButton>
                    </SignedOut>

                    <SignedIn>
                        <UserButton appearance={{
                            elements: {
                                avatarBox: "user-avatar",
                                userButtonPopoverCard: "user-popover",
                                userPreviewMainIdentifier: "user-identifier",
                            },
                        }}
                            afterSignOutUrl='/'
                        />
                    </SignedIn>
                </div>
            </nav>
        </header>
    )
}

export default Header;