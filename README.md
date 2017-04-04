# Capstone-LenskitWeb

get started with node/express:

1. install node.js - https://nodejs.org/en/
2. on the command line write this->     npm install --save express@4.15.2
3. on the command line write this->     npm install --save socket.io
4. to run node.js use->   node index
5. on a webtab it will be listeting at localhost:3000

How to run modified Lenskit:
1. Go to the Lenskit directory with the gradle.build file. (Should be Lenskit/lenskit)
2. Run "gradlew install" to compile and install the modified lenskit to the local maven repository.
3. After doing this, go back and enter the eval-quickstart directory.
4. Run "gradle build" to run the eval-quickstart gradle.build file.
5. Finally, run "gradlew evaluate".
PS: If you run evaluate again after already running it to completion, you may have to run "gradle clean" first.
