# Capstone-LenskitWeb

get started with node/express:

1. install node.js - https://nodejs.org/en/
2. on the command line write this->     npm install --save express@4.15.2
3. on the command line write this->     npm install --save socket.io
4. on the command line write this->     npm install body-parser
5. to run node.js use->   node index
6. on a webtab it will be listeting at localhost:3000

UPDATE: For some reason, when I try to push up lenskit to the repository, it does not work, so I will update how to do it.
#How to run modified Lenskit:
1. Go to https://github.com/lenskit/lenskit and clone lenskit to a repository.
2. I provided the files that I manipulated/created for our WebApp. First, enter the lenskit directory and update the gradle.build file to the one in this repository.
3. Next, go lenskit-eval/src/main/java/org/lenskit/eval/traintest and inside traintest, you should see TraintestExperiment.java.
Replace it with the one in this repository, and place the WebAppListener there too.
4. Go to the Lenskit directory with the gradle.build file. (Should be in the first directory in lenskit)
5. Run "gradlew install" to compile and install the modified lenskit to the local maven repository.
6. After doing this, go back and enter the eval-quickstart directory.
7. Run "gradle build" to run the eval-quickstart gradle.build file.
8. Finally, run "gradlew evaluate".
PS: If you run evaluate again after already running it to completion, you may have to run "gradle clean" first.
