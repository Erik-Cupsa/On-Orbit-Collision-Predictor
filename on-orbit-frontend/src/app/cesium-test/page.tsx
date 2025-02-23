'use client';

import { useEffect, useRef } from 'react';
import * as Cesium from 'cesium';
import { Viewer, CzmlDataSource } from 'cesium';
import "cesium/Build/Cesium/Widgets/widgets.css";
import { cesiumIonAccessToken, generateCzml } from './cesium-client';

Cesium.Ion.defaultAccessToken = cesiumIonAccessToken;
Cesium.buildModuleUrl.setBaseUrl('/Cesium/');

const CesiumTestPage = () => {
    const cesiumContainerRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        if (!cesiumContainerRef.current) return;
        
        const viewer = new Viewer(cesiumContainerRef.current, {
            shouldAnimate: true
        });
        
        const czmlData = generateCzml();
        const czmlDataSource = new CzmlDataSource();
        czmlDataSource.load(czmlData);
        viewer.dataSources.add(czmlDataSource);
        
        return () => viewer.destroy();
    }, []);
    
    return <div ref={cesiumContainerRef} style={{ width: '100vw', height: '100vh' }} />;
};

export default CesiumTestPage;