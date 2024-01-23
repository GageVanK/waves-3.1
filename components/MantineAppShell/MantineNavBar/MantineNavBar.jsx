import { useContext, useEffect, useState } from 'react';
import { Group, Code, Avatar, Center, Divider, Space, Text, ActionIcon, UnstyledButton } from '@mantine/core';
import {
  IconBellRinging,
  IconFingerprint,
  IconKey,
  IconSettings,
  Icon2fa,
  IconDatabaseImport,
  IconReceipt2,
  IconSwitchHorizontal,
  IconLogout,
} from '@tabler/icons-react';
import { RxDotFilled } from "react-icons/rx";
import { GiWaveSurfer } from "react-icons/gi";
import classes from './MantineNavBar.module.css';
import { getPostsStateless, getIsFollowing, getUnreadNotificationsCount, setNotificationMetadata } from 'deso-protocol';
import { DeSoIdentityContext } from 'react-deso-protocol';
import Link from 'next/link';

export function MantineNavBar() {
  const [wavesFeed, setWavesFeed] = useState([]);
  const [followingWaves, setFollowingWaves] = useState([]);
  const { currentUser } = useContext(DeSoIdentityContext);

  // Function to filter out duplicate usernames from an array of posts
const filterUniqueUsernames = (posts) => {
  const uniqueUsernames = [];
  const filteredPosts = posts.filter((post) => {
    const username = post.ProfileEntryResponse?.Username;
    if (!uniqueUsernames.includes(username)) {
      uniqueUsernames.push(username);
      return true;
    }
    return false;
  });
  return filteredPosts;
};
 
  useEffect(() => {
    const fetchWavesFeed = async () => {
      try {

        const followerFeedData = await getPostsStateless({
          ReaderPublicKeyBase58Check: "BC1YLfjx3jKZeoShqr2r3QttepoYmvJGEs7vbYx1WYoNmNW9FY5VUu6",
          NumToFetch: 100,
          GetPostsForFollowFeed: true,
        });

        // Iterate through posts and filter based on conditions
        const filteredPosts = filterUniqueUsernames(
          followerFeedData.PostsFound.filter((post) => post.PostExtraData.WavesStreamTitle)
        );
  
        setWavesFeed(filteredPosts);

      } catch (error) {
        console.log("Something went wrong:", error);
      }
    };

    fetchWavesFeed();
  }, []);

  // Check if the current user is following the profiles in filteredPosts
  const fetchFollowingWaves = async () => {
    const followingPosts = [];
    for (const post of wavesFeed) {
      const response = await getIsFollowing({
        PublicKeyBase58Check: currentUser.PublicKeyBase58Check,
        IsFollowingPublicKeyBase58Check: post.ProfileEntryResponse.PublicKeyBase58Check,
      });
      if (response.IsFollowing === true) {
        followingPosts.push(post);
      }
    }
    setFollowingWaves(followingPosts);
  };

  
 
// Fetch the followingPosts when the currentUser changes
useEffect(() => {
  if (currentUser) {
    fetchFollowingWaves();
  }
}, [currentUser, wavesFeed]);


  return (
    
    <nav>
      <div>
      <Space h="lg" />
            
              <Text fs="italic" size="md" fw={800}  ta="center">
                Following
              </Text>
              <Space w={2}/>
              
           
            <Space h="sm" />
            {currentUser ? (
              followingWaves && followingWaves.length > 0 ? (
                followingWaves.map((post) => {
                    return (
                    <UnstyledButton
                      component={Link}
                      href={`/wave/${post.ProfileEntryResponse.Username}`}
                      className={classes.user}
                      >
                      <Group>
                        <Avatar
                           src={
                            post.ProfileEntryResponse.ExtraData?.LargeProfilePicURL ||
                            `https://node.deso.org/api/v0/get-single-profile-picture/${post.ProfileEntryResponse.PublicKeyBase58Check}` ||
                            null
                          }
                          radius="xl"
                         
                        />
            
                        <div style={{ flex: 1, maxWidth: 111 }}>
                          <Text size="sm" fw={500} truncate="end">
                          {post.ProfileEntryResponse?.ExtraData?.DisplayName || post.ProfileEntryResponse.Username}
                          </Text>
                        </div>

                        
                      </Group>

                      
                    </UnstyledButton>

                    );
                  })
              ) : (
                <>
                 <Space h="lg" />
                  
                    <Text ml={22} fz="xs" fw={500} lineClamp={2}>
                      No Followers are Live.
                    </Text>
                  
                  <Space h="lg" />
                </>
              )
            ) : (
              <>
               <Space h="lg" />
                
                  <Text ml={22} fz="xs" fw={500} lineClamp={2}>
                    Sign in to view your Following.
                  </Text>
             
                <Space h="lg" />
              </>
            )}

            <Space h="lg" />

            
            <Text fs="italic" size="md" fw={800}  ta="center">
                Recommended Waves
              </Text>
          

            <Space h="sm" />
            {wavesFeed && wavesFeed.length > 0 ? (
              wavesFeed.map((post) => (
                <UnstyledButton
                      component={Link}
                      href={`/wave/${post.ProfileEntryResponse.Username}`}
                      className={classes.user}
                      >
                      <Group>
                        <Avatar
                           src={
                            post.ProfileEntryResponse.ExtraData?.LargeProfilePicURL ||
                            `https://node.deso.org/api/v0/get-single-profile-picture/${post.ProfileEntryResponse.PublicKeyBase58Check}` ||
                            null
                          }
                          radius="xl"
                        />
            
                        <div style={{ flex: 1, maxWidth: 111 }}>
                          <Text size="sm" fw={500} truncate="end">
                          {post.ProfileEntryResponse?.ExtraData?.DisplayName || post.ProfileEntryResponse.Username}
                          </Text>
                        </div>

                       
                   
                      </Group>

                      
                    </UnstyledButton>
              ))
            ) : (
              <>
              <Space h="lg" />
                
                  <Text ml={22} fz="xs" fw={500} lineClamp={1}>
                    No Waves Right Now.
                  </Text>
               
                </>
            )}


            <Space h="lg" />

  
  
      </div>
    </nav>
  );
}