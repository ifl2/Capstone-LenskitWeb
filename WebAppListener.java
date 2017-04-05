package org.lenskit.eval.traintest;

import com.google.common.base.Stopwatch;
import com.google.common.eventbus.Subscribe;
import org.lenskit.util.monitor.JobEvent;
import org.lenskit.util.monitor.TrackedJob;
import org.slf4j.Logger;
import java.net.Socket;
import java.util.Scanner;
import java.io.IOException;
import java.net.UnknownHostException;
import java.util.Date;
import java.io.BufferedReader;
import java.io.DataOutputStream;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.sql.Timestamp;

import java.io.*;

public class WebAppListener {
    public static Logger log;
    private static Socket socket;
    private static PrintStream ps;
    private static final String USER_AGENT = "Mozilla/5.0";

    public WebAppListener(Logger logger) throws Exception {
        log=logger;
        log.info("WebListener was created");
    }

    @Subscribe
    public static void EventStart(JobEvent.Started js) throws Exception {
        log.info("START!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        String url = "http://localhost:3000";
        URL obj = new URL(url);
        HttpURLConnection con = (HttpURLConnection) obj.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("User-Agent", USER_AGENT);
        con.setRequestProperty("Accept-Language", "en-US,en;q=0.5");
        con.setRequestProperty("Content-Type","application/json");
        con.setDoOutput(true);
        TrackedJob job = js.getJob();
        TrackedJob parent = job.getParent();
        if (job.getType().equals(ExperimentJob.JOB_TYPE)) {
            assert parent != null;
            String jobString = CreateJSON(job,parent,0);
            sendPostRequest(jobString,log,con);
        } else if (parent != null && parent.getType().equals(ExperimentJob.JOB_TYPE)) {
            //started task
            String jobType=job.getType();
            String jobDescription=job.getDescription();
            String jobString = CreateJSON(job,parent,0);
            sendPostRequest(jobString,log,con);
        } else {
            //started job
            String jobType=job.getType();
            String jobDescription=job.getDescription();
            String jobString = CreateJSON(job,parent,0);
            sendPostRequest(jobString,log,con);
        }
    }

    @Subscribe
    public static void EventFinish(JobEvent.Finished jf) throws Exception{
        log.info("FINISHED!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        String url = "http://localhost:3000";
        URL obj = new URL(url);
        HttpURLConnection con = (HttpURLConnection) obj.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("User-Agent", USER_AGENT);
        con.setRequestProperty("Accept-Language", "en-US,en;q=0.5");
        con.setRequestProperty("Content-Type","application/json");
        con.setDoOutput(true);
        TrackedJob job = jf.getJob();
        TrackedJob parent = job.getParent();
        if (job.getType().equals(ExperimentJob.JOB_TYPE)) {
            // finished eval job
            assert parent != null;
            String jobString = CreateJSON(job,parent,2);
            sendPostRequest(jobString,log,con);


        } else if (parent != null && parent.getType().equals(ExperimentJob.JOB_TYPE)) {
            //finished task with time
            String jobString = CreateJSON(job,parent,2);
            sendPostRequest(jobString,log,con);

        } else {
            //finished job
            //jobType=job.getType();
            //jobDescription=job.getDescription();
            String jobString = CreateJSON(job,parent,2);
            sendPostRequest(jobString,log,con);
        }
    }

    @Subscribe
    public static void EventFailed(JobEvent.Failed jf){
        String description=jf.getJob().getDescription();
        Throwable exception;
        exception = jf.getException();
    }

    @Subscribe
    public static void EventProgressUpdate(JobEvent.ProgressUpdate jp) throws Exception{
        log.info("PROGRESS!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        String url = "http://localhost:3000";
        URL obj = new URL(url);
        HttpURLConnection con = (HttpURLConnection) obj.openConnection();
        con.setRequestMethod("POST");
        con.setRequestProperty("User-Agent", USER_AGENT);
        con.setRequestProperty("Accept-Language", "en-US,en;q=0.5");
        con.setRequestProperty("Content-Type","application/json");
        con.setDoOutput(true);
        TrackedJob job = jp.getJob();
        TrackedJob parent = job.getParent();
        if (job.getType().equals(ExperimentJob.JOB_TYPE)) {
            // eval job progress update
            String jobString = CreateJSON(job,parent,1);
            sendPostRequest(jobString,log,con);

        } else if (parent != null && parent.getType().equals(ExperimentJob.JOB_TYPE)) {
            //eval progress update
            String jobString = CreateJSON(job,parent,1);
            sendPostRequest(jobString,log,con);
        } else {
            //progress

            String jobString = CreateJSON(job,parent,1);
            sendPostRequest(jobString,log,con);
        }
    }

    private static void sendPostRequest(String jobInfoJson, Logger log, HttpURLConnection con) throws Exception {

        DataOutputStream wr = new DataOutputStream(con.getOutputStream());
        wr.writeBytes(jobInfoJson);
        wr.flush();
        wr.close();
        BufferedReader in = new BufferedReader( new InputStreamReader(con.getInputStream()));
        String output;
        StringBuffer response = new StringBuffer();

        while ((output = in.readLine()) != null) {
            response.append(output);
        }
        in.close();

    }

    private static String CreateJSON(TrackedJob job,TrackedJob parent, int typeOfUpdate){
        String data = "{";
        data= data.concat("\"id\":\"" + job.getUUID().toString() + "\",");
        data= data.concat("\"type\":\"" + job.getType() + "\",");
        if (job.getDescription()!=null){
            data= data.concat("\"description\":\"" + job.getDescription() + "\",");
        }
        else{
            data= data.concat("\"description\":\"null\",");
        }
        if (typeOfUpdate==0 || typeOfUpdate==1) {
            data = data.concat("\"completed\":\"false\",");
        }
        else if (typeOfUpdate==2){
            data = data.concat("\"completed\":\"true\",");
        }
        data= data.concat("\"expectedSteps\":\"" + job.getExpectedSteps() + "\",");
        data=data.concat("\"stepsFinished\":\"" + job.getStepsFinished() + "\",");
        Timestamp timestamp = new Timestamp(System.currentTimeMillis());
        if (typeOfUpdate==0) {
            data = data.concat("\"startingTime\":\"" + timestamp.toString() + "\",");
        }
        else{
            data = data.concat("\"startingTime\":\"null\",");
        }
        if (typeOfUpdate == 0 || typeOfUpdate == 1) {
            data = data.concat("\"finishingTime\":\"null\",");
        }
        else if (typeOfUpdate==2){
            data = data.concat("\"finishingTime\":\"" + timestamp.toString() + "\",");
        }
        if (parent.getUUID()!=null) {
            data = data.concat("\"parentID\":\"" + parent.getUUID() + "\",");
        }
        else{
            data = data.concat("\"parentID\":\"null\",");
        }
        data = data.concat("\"eventNumber\":\"" + typeOfUpdate + "\"}");
        return data;
    }
}
