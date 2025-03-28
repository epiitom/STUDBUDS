import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/clerk-react"
import { FileText, GraduationCap, LayoutDashboard, PenBox, Stars } from 'lucide-react'
import { useNavigate } from "react-router-dom"
import ToggleMode from "./toggle-mode";
import { useState } from "react";

const Header = () => {
    const navigate = useNavigate(); // Initialize useNavigate
    const [isDropdownOpen, setDropdownOpen] = useState(false);
    return (
        <header className="header">
            <nav className="nav">
                <div className="nav-logo">StudyBuds</div>

                <div className="nav-items">
                    <SignedIn>
                        <button className="dashboard-btn" onClick={() => navigate('/app')}>
                            <LayoutDashboard className='dashboard-icon' />
                            <span className='dashboard-text'>Industry Insights</span>
                        </button>

                        {/* Growth Tools Dropdown */}
                        <div className="dropdown">
                            <button
                                className="dropdown-btn"
                                onClick={() => setDropdownOpen(!isDropdownOpen)}
                            >
                                <Stars className="dropdown-icon" />
                                <span className="dropdown-text">Growth Tools</span>
                            </button>

                            {isDropdownOpen && (
                                <div className="dropdown-menu">
                                    <button className="dropdown-item" onClick={() => navigate("/app")}>
                                        <GraduationCap className="menu-icon" />
                                        Study Prep
                                    </button>
                                    <button className="dropdown-item" onClick={() => navigate("/resume")}>
                                        <FileText className="menu-icon" />
                                        Build Resume
                                    </button>
                                    <button className="dropdown-item" onClick={() => navigate("/ai-cover-letter")}>
                                        <PenBox className="menu-icon" />
                                        Cover Letter
                                    </button>
                                </div>
                            )}
                        </div>
                    </SignedIn>

                    <ToggleMode />

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