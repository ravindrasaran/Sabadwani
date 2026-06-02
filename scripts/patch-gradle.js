import fs from 'fs';
import path from 'path';

const gradlePath = path.join(process.cwd(), 'node_modules', 'capacitor-navigationbar', 'android', 'build.gradle');

if (fs.existsSync(gradlePath)) {
  try {
    let content = fs.readFileSync(gradlePath, 'utf8');
    
    // Check if namespace is already defined
    if (!content.includes('namespace')) {
      console.log('Patching capacitor-navigationbar build.gradle to add namespace...');
      
      // We will insert namespace inside the android { ... } block
      content = content.replace(/android\s*\{/, 'android {\n    namespace "com.nikosdouvlis.navigationbar.capacitornavigationbar"');
      
      fs.writeFileSync(gradlePath, content, 'utf8');
      console.log('Successfully patched build.gradle for capacitor-navigationbar!');
    } else {
      console.log('capacitor-navigationbar build.gradle is already patched.');
    }
  } catch (error) {
    console.error('Error patching build.gradle:', error);
  }
} else {
  console.log('capacitor-navigationbar build.gradle was not found. Skipping patch.');
}
