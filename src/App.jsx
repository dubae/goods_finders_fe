import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';

// 메인 배경의 3D 객체
function RotatingShape() {
  const meshRef = useRef();
  useFrame(() => {
    meshRef.current.rotation.x += 0.005;
    meshRef.current.rotation.y += 0.005;
  });
  return (
    <mesh ref={meshRef}>
      <torusKnotGeometry args={[9, 2.5, 100, 16]} />
      <meshStandardMaterial color="#8b5cf6" wireframe />
    </mesh>
  );
}

// 로딩 중일 때 나타나는 3D 스피너 애니메이션
function LoadingSpinner3D() {
  const meshRef = useRef();
  useFrame(() => {
    meshRef.current.rotation.x += 0.05;
    meshRef.current.rotation.y += 0.05;
  });
  return (
    <mesh ref={meshRef}>
      <octahedronGeometry args={[2, 0]} />
      <meshStandardMaterial color="#d8b4fe" wireframe />
    </mesh>
  );
}

function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false); // 검색 시도 여부
  
  const [availableSites, setAvailableSites] = useState([]);
  const [selectedSites, setSelectedSites] = useState([]);
  const [sortOrder, setSortOrder] = useState('default');

  useEffect(() => {
    if (results.length > 0) {
      const sites = [...new Set(results.map(item => item.site))];
      setAvailableSites(sites);
      setSelectedSites(sites);
    } else {
      setAvailableSites([]);
      setSelectedSites([]);
    }
  }, [results]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setHasSearched(true);
    setResults([]);
    setSortOrder('default');
    
    try {
      const response = await fetch(`http://localhost:8000/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      if (data.items) setResults(data.items);
    } catch (error) {
      alert("서버와 연결할 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckboxChange = (site) => {
    setSelectedSites(prev => 
      prev.includes(site) ? prev.filter(s => s !== site) : [...prev, site]
    );
  };

  const getPriceNumber = (priceString) => {
    return parseInt(priceString.replace(/[^0-9]/g, '')) || 0;
  };

  const displayedResults = results
    .filter(item => selectedSites.includes(item.site))
    .sort((a, b) => {
      if (sortOrder === 'price_asc') return getPriceNumber(a.price) - getPriceNumber(b.price);
      if (sortOrder === 'price_desc') return getPriceNumber(b.price) - getPriceNumber(a.price);
      return 0;
    });

  return (
    <div className="relative w-full min-h-screen bg-gray-950 overflow-auto font-sans">
      <div className="fixed inset-0 z-0">
        <Canvas camera={{ position: [0, 0, 30] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
          <RotatingShape />
          <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
        </Canvas>
      </div>

      <div className="relative z-10 flex flex-col items-center pt-32 px-4 pb-20 min-h-screen">
        <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-widest drop-shadow-2xl">
          GOODS FINDER
        </h1>
        
        <div className="w-full max-w-3xl p-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_0_40px_rgba(139,92,246,0.3)] flex flex-col md:flex-row items-center gap-2 transition-all hover:bg-white/15">
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="캐릭터 이름이나 작품명을 입력하세요..." 
            className="w-full px-6 py-4 bg-transparent text-white placeholder-gray-300 focus:outline-none text-lg"
          />
          <button 
            onClick={handleSearch}
            disabled={loading}
            className="w-full md:w-auto px-10 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </div>

        {/* 🌟 1. 로딩 중일 때 3D 애니메이션 표시 */}
        {loading && (
          <div className="w-full mt-20 flex flex-col items-center justify-center">
            <div className="w-48 h-48">
              <Canvas>
                <ambientLight intensity={0.5} />
                <pointLight position={[10, 10, 10]} />
                <LoadingSpinner3D />
              </Canvas>
            </div>
            <p className="mt-4 text-xl text-purple-400 font-bold animate-pulse tracking-widest">
              웹 상의 굿즈를 끌어모으는 중...
            </p>
          </div>
        )}

        {/* 🌟 2. 검색 결과가 없을 때 (로딩 끝난 후) */}
        {!loading && hasSearched && results.length === 0 && (
          <p className="mt-20 text-2xl text-gray-400 font-light">
            해당 검색어에 대한 굿즈가 없거나 모두 품절되었습니다 😢
          </p>
        )}

        {/* 필터 및 정렬 (로딩이 끝나고 결과가 있을 때만 표시) */}
        {!loading && results.length > 0 && (
          <div className="w-full max-w-6xl mt-10 flex flex-col md:flex-row justify-between items-center bg-gray-900/50 backdrop-blur-md p-4 rounded-xl border border-white/10">
            <div className="flex flex-wrap items-center gap-4 mb-4 md:mb-0">
              <span className="text-gray-400 font-medium mr-2">구매처 필터:</span>
              {availableSites.map(site => (
                <label key={site} className="flex items-center gap-2 text-white cursor-pointer hover:text-purple-400 transition-colors">
                  <input 
                    type="checkbox" 
                    checked={selectedSites.includes(site)}
                    onChange={() => handleCheckboxChange(site)}
                    className="w-4 h-4 accent-purple-600 cursor-pointer"
                  />
                  {site}
                </label>
              ))}
              
              {/* 🌟 3. 검색 결과 개수 표시 */}
              <span className="ml-4 px-3 py-1 bg-purple-900/50 text-purple-200 border border-purple-500/30 rounded-full text-sm font-bold shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                총 {displayedResults.length}건
              </span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="text-gray-400 font-medium">정렬 기준:</span>
              <select 
                value={sortOrder} 
                onChange={(e) => setSortOrder(e.target.value)}
                className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-purple-500"
              >
                <option value="default">기본 정렬</option>
                <option value="price_asc">가격 낮은 순</option>
                <option value="price_desc">가격 높은 순</option>
              </select>
            </div>
          </div>
        )}

        {/* 굿즈 그리드 */}
        {!loading && displayedResults.length > 0 && (
          <div className="w-full max-w-6xl mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {displayedResults.map((item, index) => (
              <a 
                key={index} href={item.link} target="_blank" rel="noopener noreferrer"
                className="group flex flex-col bg-gray-900/60 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:border-purple-500/50 hover:shadow-[0_0_30px_rgba(139,92,246,0.2)] transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="w-full h-48 bg-white overflow-hidden relative flex items-center justify-center p-2">
                  <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded backdrop-blur-md z-10">
                    {item.site}
                  </div>
                  <img 
                    src={item.image_url} alt={item.title} 
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex flex-col flex-grow">
                  <h3 className="text-white font-medium line-clamp-2 mb-3">{item.title}</h3>
                  <div className="mt-auto flex justify-between items-center">
                    <span className="text-purple-400 font-bold text-lg">{item.price}</span>
                    <span className="text-gray-400 text-sm">보러가기 ➔</span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;