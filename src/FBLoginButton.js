import React, { useEffect } from 'react';

function FacebookLoginButton({ configId }) {
  useEffect(() => {
    // Ensure FB SDK is loaded
    if (!window.FB) {
      window.fbAsyncInit = function() {
        window.FB.init({
          appId: '824528361899466',
          cookie: true,
          xfbml: true,
          version: 'v19.0'
        });

        window.FB.XFBML.parse();
      };

      (function(d, s, id) {
        var js, fjs = d.getElementsByTagName(s)[0];
        if (d.getElementById(id)) return;
        js = d.createElement(s); js.id = id;
        js.src = "https://connect.facebook.net/en_US/sdk.js";
        fjs.parentNode.insertBefore(js, fjs);
      }(document, 'script', 'facebook-jssdk'));
    } else {
      // SDK already loaded, parse XFBML
      window.FB.XFBML.parse();
    }
  }, []);

  return (
    <div id="fb-root">
      {/* Adding config_id as a data attribute for custom handling */}
      <div className="fb-login-button"
           data-width=""
           data-size="large"
           data-button-type="continue_with"
           data-layout="default"
           data-auto-logout-link="false"
           data-use-continue-as="true"
           data-config-id={configId}>
      </div>
    </div>
  );
}

export default FacebookLoginButton;
