import Layout from "./Layout.jsx";
import Test from "./Test";

import Home from "./Home";

import About from "./About";

import Events from "./Events";

import We from "./We";

import Love from "./Love";
import LoveSimple from "./LoveSimple";
import LoveTest from "./LoveTest";
import LoveStep1 from "./LoveStep1";
import LoveFixed from "./LoveFixed";
import LoveReal from "./LoveReal";
import EventDetail from "./EventDetail";
import SpaceDetail from "./SpaceDetail";
import AddSpace from "./AddSpace";
import AddEvent from "./AddEvent";
import EditEvent from "./EditEvent";
import EditSpace from "./EditSpace";

import You from "./You";

import Admin from "./Admin";
import AdminEventManager from "./AdminEventManager";

import SpaceDashboard from "./SpaceDashboard";
import PartnerDashboard from "./PartnerDashboard";
import PartnerSpaces from "./PartnerSpaces";
import PartnerEvents from "./PartnerEvents";

import ArtistDashboard from "./ArtistDashboard";

import WeArticle from "./WeArticle";

import ShareStory from "./ShareStory";

import Terms from "./Terms";

import Privacy from "./Privacy";

import Contact from "./Contact";

import FAQ from "./FAQ";

import NewsletterManagement from "./NewsletterManagement";
import GoogleCallback from "./GoogleCallback";
import ForgotPassword from "./ForgotPassword";
import ResetPassword from "./ResetPassword";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    Test: Test,
    Home: Home,
    
    About: About,
    
    Events: Events,
    
    We: We,
    
    Love: Love,
    
    You: You,
    
    Admin: Admin,
    
    SpaceDashboard: SpaceDashboard,
    PartnerDashboard: PartnerDashboard,
    PartnerSpaces: PartnerSpaces,
    PartnerEvents: PartnerEvents,
    
    ArtistDashboard: ArtistDashboard,
    
    WeArticle: WeArticle,
    
    ShareStory: ShareStory,
    
    Terms: Terms,
    
    Privacy: Privacy,
    
    Contact: Contact,
    
    FAQ: FAQ,
    
    NewsletterManagement: NewsletterManagement,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout>
            <Routes>            
                <Route path="/test" element={<Test />} />
                    <Route path="/" element={<Home />} />
                
                
                <Route path="/Home" element={<Home />} />
                
                <Route path="/About" element={<About />} />
                
                <Route path="/Events" element={<Events />} />
                
                <Route path="/We" element={<We />} />
                <Route path="/we" element={<We />} />
                
                <Route path="/Love" element={<LoveReal />} />
                <Route path="/event/:id" element={<EventDetail />} />
                <Route path="/space/:id" element={<SpaceDetail />} />
                
                <Route path="/You" element={<You />} />
                
                <Route path="/Admin" element={<Admin />} />
                <Route path="/AdminEventManager" element={<AdminEventManager />} />
                <Route path="/AddSpace" element={<AddSpace />} />
                <Route path="/AddEvent" element={<AddEvent />} />
                <Route path="/EditEvent/:id" element={<EditEvent />} />
                <Route path="/EditSpace/:id" element={<EditSpace />} />
                
                <Route path="/SpaceDashboard" element={<SpaceDashboard />} />
                <Route path="/PartnerDashboard" element={<PartnerDashboard />} />
                <Route path="/PartnerSpaces" element={<PartnerSpaces />} />
                <Route path="/PartnerEvents" element={<PartnerEvents />} />
                
                <Route path="/ArtistDashboard" element={<ArtistDashboard />} />
                
                <Route path="/WeArticle" element={<WeArticle />} />
                
                <Route path="/ShareStory" element={<ShareStory />} />
                
                <Route path="/Terms" element={<Terms />} />
                
                <Route path="/Privacy" element={<Privacy />} />
                
                <Route path="/Contact" element={<Contact />} />
                
                <Route path="/FAQ" element={<FAQ />} />
                
                <Route path="/NewsletterManagement" element={<NewsletterManagement />} />
                
                <Route path="/auth/google/callback" element={<GoogleCallback />} />
                <Route path="/ForgotPassword" element={<ForgotPassword />} />
                <Route path="/ResetPassword" element={<ResetPassword />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}