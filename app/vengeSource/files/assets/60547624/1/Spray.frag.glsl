vec3 combineColor() {
    if(dAtten > 0.1){
        #ifdef LIGHT_COOKIE
            vec4 spray = getCookie2DClipXform(
                light1_cookie, 
                light1_shadowMatrix, 
                light1_cookieIntensity,
                light1_cookieMatrix,
                light1_cookieOffset
            );
            
            return mix(
                dAlbedo * dDiffuseLight, dAtten * spray.rgb, spray.a
            );
        #else
            return dAlbedo * dDiffuseLight;
        #endif
    }else{
        return dAlbedo * dDiffuseLight;
    }
}
