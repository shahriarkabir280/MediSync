import React from "react";

const LogoutTab = () => {
    return(
        <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Logout</h1>
            <p className="text-muted-foreground">You have successfully logged out.</p>
            <div className="mt-6">
                <button 
                    onClick={() => window.location.href = '/login'} 
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                    Go to Login
                </button>
            </div>
        </div>
    );
};
export default LogoutTab;