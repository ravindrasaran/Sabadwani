const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf-8');

const startIndex = code.indexOf('const renderScreen = () => {');
const stopIndex = code.indexOf('return (', startIndex);

if (startIndex !== -1 && stopIndex !== -1) {
    const chunkToRemove = code.substring(startIndex, stopIndex);

const newRenderScreen = `const renderScreen = () => {
    return (
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <HomeScreen
            isLoading={isLoading}
            processedMeles={processedMeles}
            badhais={badhais}
            dailyThought={dailyThought}
            notices={notices}
            handleOpenCategory={handleOpenCategory}
            navigateTo={navigateTo}
          />
        } />
        <Route path="/search" element={
          <SearchScreen
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isLoading={isLoading}
            sabads={sabads}
            aartis={aartis}
            bhajans={bhajans}
            sakhis={sakhis}
            mantras={mantras}
            meles={meles}
            matchSearch={(title, text) => {
              if (!searchQuery) return false;
              if (title.toLowerCase().includes(searchQuery.toLowerCase())) return true;
              if (text && text.toLowerCase().includes(searchQuery.toLowerCase())) return true;
              const titleSkeleton = getSearchSkeleton(title);
              const searchSkeleton = getSearchSkeleton(searchQuery);
              if (searchSkeleton.length < 2) return false;
              if (titleSkeleton.includes(searchSkeleton)) return true;
              if (text) {
                 const textSkeleton = getSearchSkeleton(text);
                 if (textSkeleton.includes(searchSkeleton)) return true;
              }
              return false;
            }}
            handleSabadClick={handleSabadClick}
            setSelectedSabad={setSelectedSabad}
            setSelectedCategory={setSelectedCategory}
            setAutoPlayAudio={setAutoPlayAudio}
            navigateTo={navigateTo}
          />
        } />
        <Route path="/mala" element={
          <JaapMalaScreen
            malaCount={malaCount}
            malaLaps={malaLaps}
            onBack={() => navigateTo('home')}
            onJap={() => {
              vibrate(12);
              playOmVishnu();
              if (malaCount + 1 >= 108) {
                vibrate([50, 30, 100, 30, 50]);
                setMalaCount(0);
                setMalaLaps(l => l + 1);
              } else {
                setMalaCount(c => c + 1);
              }
            }}
            onReset={() => {
              setConfirmDialog({
                isOpen: true,
                title: "माला रीसेट",
                message: "क्या आप वाकई माला रीसेट करना चाहते हैं?",
                onConfirm: () => {
                  setMalaCount(0);
                  setMalaLaps(0);
                }
              });
            }}
          />
        } />
        <Route path="/niyam" element={<NiyamScreen niyamList={niyamList} navigateTo={navigateTo} />} />
        <Route path="/shabad_list" element={
          <ShabadListScreen 
            isLoading={isLoading} 
            sabads={sabads} 
            handleBack={handleBack} 
            handleSabadClick={handleSabadClick} 
          />
        } />
        <Route path="/category_list" element={
          <CategoryListScreen
            isLoading={isLoading}
            selectedCategory={selectedCategory}
            aartis={aartis}
            bhajans={bhajans}
            sakhis={sakhis}
            mantras={mantras}
            handleBack={handleBack}
            navigateTo={navigateTo}
            setSelectedSabad={setSelectedSabad}
            setAutoPlayAudio={setAutoPlayAudio}
          />
        } />
        <Route path="/community_posts" element={
          <CommunityPostsScreen
            isLoading={isLoading}
            recentApprovedPosts={recentApprovedPosts}
            myPendingPosts={myPendingPosts}
            handleBack={handleBack}
            navigateTo={navigateTo}
            setSelectedSabad={setSelectedSabad}
            setSelectedCategory={setSelectedCategory}
            setAutoPlayAudio={setAutoPlayAudio}
          />
        } />
        <Route path="/reading" element={
          <ReadingScreen
            currentScreen="reading"
            selectedSabad={selectedSabad}
            selectedCategory={selectedCategory}
            sabads={sabads}
            aartis={aartis}
            bhajans={bhajans}
            sakhis={sakhis}
            mantras={mantras}
            readingTheme={readingTheme}
            setReadingTheme={setReadingTheme}
            hasSeenSwipeHint={hasSeenSwipeHint}
            handleBack={handleBack}
            fontSize={fontSize}
            setFontSize={setFontSize}
            isAutoScrolling={isAutoScrolling}
            toggleAutoScroll={toggleAutoScroll}
            autoScrollSpeed={autoScrollSpeed}
            cycleAutoScrollSpeed={cycleAutoScrollSpeed}
            toggleBookmark={toggleBookmark}
            bookmarks={bookmarks}
            handleShare={handleShare}
            autoPlayAudio={autoPlayAudio}
            setAutoPlayAudio={setAutoPlayAudio}
            playingSabad={playingSabad}
            setPlayingSabad={setPlayingSabad}
            setIsAudioActive={setIsAudioActive}
            handleAudioEnded={handleAudioEnded}
            handleSwipe={handleSwipe}
            handleAudioSwipe={handleAudioSwipe}
            showToast={showToast}
            settings={settings}
            vibrate={vibrate}
            slideDir={slideDir}
            bindGestures={bindGestures}
          />
        } />
        <Route path="/audio_reading" element={
          <ReadingScreen
            currentScreen="audio_reading"
            selectedSabad={selectedSabad}
            selectedCategory={selectedCategory}
            sabads={sabads}
            aartis={aartis}
            bhajans={bhajans}
            sakhis={sakhis}
            mantras={mantras}
            readingTheme={readingTheme}
            setReadingTheme={setReadingTheme}
            hasSeenSwipeHint={hasSeenSwipeHint}
            handleBack={handleBack}
            fontSize={fontSize}
            setFontSize={setFontSize}
            isAutoScrolling={isAutoScrolling}
            toggleAutoScroll={toggleAutoScroll}
            autoScrollSpeed={autoScrollSpeed}
            cycleAutoScrollSpeed={cycleAutoScrollSpeed}
            toggleBookmark={toggleBookmark}
            bookmarks={bookmarks}
            handleShare={handleShare}
            autoPlayAudio={autoPlayAudio}
            setAutoPlayAudio={setAutoPlayAudio}
            playingSabad={playingSabad}
            setPlayingSabad={setPlayingSabad}
            setIsAudioActive={setIsAudioActive}
            handleAudioEnded={handleAudioEnded}
            handleSwipe={handleSwipe}
            handleAudioSwipe={handleAudioSwipe}
            showToast={showToast}
            settings={settings}
            vibrate={vibrate}
            slideDir={slideDir}
            bindGestures={bindGestures}
          />
        } />
        <Route path="/amavasya" element={
          <motion.div key="amavasya" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="bg-paper min-h-screen">
            <AmavasyaScreen amavasyaList={amavasyaList} selectedYear={selectedYear} setSelectedYear={setSelectedYear} handleBack={handleBack} />
          </motion.div>
        } />
        <Route path="/donate" element={<DonateScreen navigateTo={navigateTo} settings={settings} showToast={showToast} />} />
        <Route path="/about" element={<AboutScreen navigateTo={navigateTo} settings={settings} />} />
        <Route path="/privacy" element={<PrivacyScreen navigateTo={navigateTo} />} />
        <Route path="/contribute" element={
          <ContributeScreen
            handleBack={handleBack}
            contribAuthor={contribAuthor}
            setContribAuthor={setContribAuthor}
            contribTitle={contribTitle}
            setContribTitle={setContribTitle}
            contribType={contribType}
            setContribType={setContribType}
            contribAudio={contribAudio}
            setContribAudio={setContribAudio}
            contribAudioFile={contribAudioFile}
            setContribAudioFile={setContribAudioFile}
            contribAudioError={contribAudioError}
            setContribAudioError={setContribAudioError}
            contribText={contribText}
            setContribText={setContribText}
            captchaQuestion={captchaQuestion}
            captchaAnswer={captchaAnswer}
            setCaptchaAnswer={setCaptchaAnswer}
            contribError={contribError}
            isSubmitting={isSubmitting}
            uploadProgress={uploadProgress}
            handleContributeSubmit={handleContributeSubmit}
            handleFileSelect={handleFileSelect}
          />
        } />
        <Route path="/choghadiya" element={
          <ChoghadiyaScreen
            choghadiyaDate={choghadiyaDate}
            setChoghadiyaDate={setChoghadiyaDate}
            choghadiyaLocation={choghadiyaLocation}
            setChoghadiyaLocation={setChoghadiyaLocation}
            handleGetLocation={handleGetLocation}
            calculateChoghadiya={calculateChoghadiya}
            choghadiyaLoading={choghadiyaLoading}
            choghadiyaError={choghadiyaError}
            choghadiyaSlots={choghadiyaSlots}
            handleBack={() => navigateTo("home")}
          />
        } />
        <Route path="/bichhuda" element={
          <BichhudaScreen
            bichhudaMonth={bichhudaMonth}
            setBichhudaMonth={setBichhudaMonth}
            bichhudaYear={bichhudaYear}
            setBichhudaYear={setBichhudaYear}
            bichhudaList={bichhudaList}
            handleBack={() => navigateTo("home")}
          />
        } />
        <Route path="/mele" element={
          <MelesScreen
            isLoading={isLoading}
            meles={meles}
            processedMeles={processedMeles}
            navigateTo={navigateTo}
          />
        } />
        <Route path="/admin_login" element={
          <AdminLoginScreen
            isAdminLoggingIn={isAdminLoggingIn}
            adminLoginError={adminLoginError}
            adminPasswordInput={adminPasswordInput}
            auth={auth}
            setIsAdminLoggingIn={setIsAdminLoggingIn}
            setAdminLoginError={setAdminLoginError}
            setAdminPasswordInput={setAdminPasswordInput}
            setIsAdminAuthenticated={setIsAdminAuthenticated}
            navigateTo={navigateTo}
          />
        } />
        <Route path="/admin" element={
          <AdminScreen {...{
          navigateTo, isSubmitting, contribAudioError, contribPhotoError, showToast, checkIsOnline, db,
          setContribAudioError, setContribPhotoError, setIsSubmitting, contribTitle, contribType, contribAudio,
          contribText, contribAuthor, contribDate, contribLocation, contribPhotoUrl, setContribTitle, setContribType,
          setContribAudio, setContribText, setContribAuthor, setContribDate, setContribLocation, setContribPhotoUrl,
          addDoc, collection, serverTimestamp, setContribError, contribError, pendingContributions, setPendingContributions,
          doc, updateDoc, deleteDoc, setConfirmDialog, editModalOpen, setEditModalOpen, editAudioError, editPhotoError,
          setEditAudioError, setEditPhotoError, editContribution, setEditContribution, handleUpdateContribution, handleDeleteContribution, handleFileChange,
          contribAudioFile, uploadFileToStorage, contribPhotoFile, contribSequence, setContribSequence, setContribAudioFile, setContribPhotoFile, handleFileSelect, uploadProgress, sabads, openEditModal, handleDelete, aartis, bhajans, sakhis, mantras, thoughts, meles, notices, badhais, toggleNoticeStatus, toggleBadhaiStatus, settings, setSettings, setSettingsLogoFile, settingsLogoFile, setSettingsQrCodeFile, settingsQrCodeFile, setSettingsJaapAudioFile, settingsJaapAudioFile, handleSaveSettings, pendingPosts, approvePost, rejectPost, editItemData, handleEditSave, setEditItemData
        }} />
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  };

`;

  code = code.replace(chunkToRemove, newRenderScreen);
  fs.writeFileSync('src/App.tsx', code, 'utf-8');
  console.log('Successfully replaced switch statement with Routes');
} else {
  console.log('Failed to match switch statement logic.');
}
